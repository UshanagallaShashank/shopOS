# User routes — registration and user management
# IMPORTANT: static paths (/me, /register) must come BEFORE
# dynamic paths (/{user_id}) to avoid FastAPI matching them as UUIDs.
import uuid

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_org_admin_or_above, require_platform_admin
from models.user import User
from schemas.org import OrgResponse
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


@router.get("/me/orgs", response_model=list[OrgResponse])
async def get_my_orgs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns all orgs the current user has been granted access to (for shopping)."""
    from sqlalchemy import select as _select
    from models.org import Org
    from models.user_org_access import UserOrgAccess

    result = await db.execute(
        _select(Org)
        .join(UserOrgAccess, Org.id == UserOrgAccess.org_id)
        .where(UserOrgAccess.user_id == current_user.id)
    )
    return list(result.scalars().all())


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


# ── Org-access sub-resource ────────────────────────────────────────────────

class OrgAccessBody(BaseModel):
    org_ids: list[uuid.UUID]


@router.put("/{user_id}/orgs", response_model=UserResponse)
async def set_user_org_access(
    user_id: uuid.UUID,
    body: OrgAccessBody,
    admin: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    """Replace the full set of orgs a user can access (for ordering)."""
    await user_service.set_org_access(db, user_id, body.org_ids)
    return await user_service.get_user(db, user_id)


@router.post("/{user_id}/orgs/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def grant_user_org_access(
    user_id: uuid.UUID,
    org_id: uuid.UUID,
    _: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    """Grant access to a single org."""
    await user_service.grant_org_access(db, user_id, org_id)


@router.delete("/{user_id}/orgs/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_user_org_access(
    user_id: uuid.UUID,
    org_id: uuid.UUID,
    _: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    """Revoke access to a single org."""
    await user_service.revoke_org_access(db, user_id, org_id)
