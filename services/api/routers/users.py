# User routes — registration, role requests, admin review
# IMPORTANT: static paths (/me, /register, /role-requests) must come BEFORE
# dynamic paths (/{user_id}) to avoid FastAPI matching them as UUIDs.
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_org_admin_or_above, require_platform_admin
from models.role_request import RequestStatus
from models.user import User
from schemas.role_request import RoleRequestCreate, RoleRequestResponse, RoleRequestReview
from schemas.user import UserRegister, UserResponse, UserUpdate
from services import user_service
from utils.pagination import paginate

router = APIRouter()


# ── Static routes (must be before /{user_id}) ─────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register user in ShopOS DB after Supabase signup. secret_key determines role."""
    return await user_service.register_user(db, current_user.firebase_uid, data)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the currently logged-in user's profile."""
    return current_user


@router.get("/", response_model=list[UserResponse])
async def list_users(
    org_id: uuid.UUID | None = None,
    page: dict = Depends(paginate),
    admin: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    """
    List users.
    - platform_admin / orgs_manager: all users, optionally filtered by org_id
    - org_admin: only users in their own org
    """
    effective_org_id = admin.org_id if admin.role.value == "org_admin" else org_id
    return await user_service.list_users(db, page["skip"], page["limit"], org_id=effective_org_id)


# ── Role requests (static — must be before /{user_id}) ────────────────────

@router.post("/role-requests", response_model=RoleRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_role(
    data: RoleRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Any logged-in user can request orgs_manager role."""
    return await user_service.create_role_request(db, current_user, data)


@router.get("/role-requests", response_model=list[RoleRequestResponse])
async def list_role_requests(
    status_filter: RequestStatus | None = None,
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """Only platform_admin sees all requests."""
    return await user_service.list_role_requests(db, status_filter)


@router.patch("/role-requests/{request_id}", response_model=RoleRequestResponse)
async def review_role_request(
    request_id: uuid.UUID,
    data: RoleRequestReview,
    admin: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """platform_admin approves or rejects a role request."""
    return await user_service.review_role_request(db, request_id, data.status, admin)


# ── Dynamic routes (/{user_id}) ────────────────────────────────────────────

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    return await user_service.get_user(db, user_id)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    admin: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a user's role and/or org assignment.
    - platform_admin: can change any user's role and org
    - orgs_manager: can assign/unassign users to orgs, cannot promote to platform_admin
    - org_admin: can only assign users to their own org
    """
    return await user_service.update_user(db, user_id, data, admin)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    await user_service.delete_user(db, user_id)
