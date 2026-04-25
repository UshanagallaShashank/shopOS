# User service — registration with secret-key role assignment
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.role_request import RequestStatus, RoleRequest
from models.user import User, UserRole
from schemas.role_request import RoleRequestCreate
from schemas.user import UserCreate, UserRegister, UserUpdate
from utils.exceptions import ConflictError, ForbiddenError, NotFoundError


async def list_users(db: AsyncSession, skip: int, limit: int, org_id: uuid.UUID | None = None) -> list[User]:
    q = select(User)
    if org_id is not None:
        q = q.where(User.org_id == org_id)
    result = await db.execute(q.offset(skip).limit(limit))
    return list(result.scalars().all())


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    return user


def _resolve_role(secret_key: str | None) -> UserRole:
    """Check secret key and return the matching role. Default = end_user."""
    if secret_key == settings.platform_admin_secret:
        return UserRole.platform_admin
    if secret_key == settings.org_admin_secret:
        return UserRole.org_admin
    return UserRole.end_user


async def register_user(db: AsyncSession, supabase_uid: str, data: UserRegister) -> User:
    """Called right after Supabase signup — creates the DB user with correct role."""
    existing = await db.execute(select(User).where(User.firebase_uid == supabase_uid))
    found = existing.scalar_one_or_none()

    # OAuth users hit this on every login — just return the existing user
    if found:
        return found

    role = _resolve_role(data.secret_key)

    # org_admin must provide an org_id
    if role == UserRole.org_admin and not data.org_id:
        raise ForbiddenError("org_admin registration requires an org_id")

    user = User(
        firebase_uid=supabase_uid,
        email=data.email,
        phone=data.phone,
        role=role,
        org_id=data.org_id if role == UserRole.org_admin else None,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    existing = await db.execute(select(User).where(User.firebase_uid == data.firebase_uid))
    if existing.scalar_one_or_none():
        raise ConflictError(f"User '{data.firebase_uid}' already exists")
    user = User(**data.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> None:
    user = await get_user(db, user_id)
    await db.delete(user)
    await db.commit()


async def update_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: UserUpdate,
    admin: User,
) -> User:
    """Update a user's role and/or org assignment with permission checks."""
    user = await get_user(db, user_id)

    if data.role is not None:
        # orgs_manager cannot promote to platform_admin
        if admin.role == UserRole.orgs_manager and data.role == UserRole.platform_admin:
            raise ForbiddenError("orgs_manager cannot assign platform_admin role")
        # org_admin cannot change roles at all
        if admin.role == UserRole.org_admin:
            raise ForbiddenError("org_admin cannot change user roles")
        user.role = data.role

    if data.clear_org:
        user.org_id = None
    elif data.org_id is not None:
        # org_admin can only assign to their own org
        if admin.role == UserRole.org_admin and data.org_id != admin.org_id:
            raise ForbiddenError("org_admin can only assign users to their own org")
        user.org_id = data.org_id

    await db.commit()
    await db.refresh(user)
    return user


# ── Role requests ────────────────────────────────────────────────────────────

async def create_role_request(
    db: AsyncSession, user: User, data: RoleRequestCreate
) -> RoleRequest:
    # One pending request per user at a time
    existing = await db.execute(
        select(RoleRequest).where(
            RoleRequest.user_id == user.id,
            RoleRequest.status == RequestStatus.pending,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("You already have a pending role request")

    req = RoleRequest(
        user_id=user.id,
        requested_role="orgs_manager",  # only requestable role
        reason=data.reason,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


async def list_role_requests(
    db: AsyncSession, status_filter: RequestStatus | None = None
) -> list[RoleRequest]:
    q = select(RoleRequest)
    if status_filter:
        q = q.where(RoleRequest.status == status_filter)
    result = await db.execute(q.order_by(RoleRequest.created_at.desc()))
    return list(result.scalars().all())


async def review_role_request(
    db: AsyncSession,
    request_id: uuid.UUID,
    new_status: RequestStatus,
    reviewer: User,
) -> RoleRequest:
    result = await db.execute(select(RoleRequest).where(RoleRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise NotFoundError(f"Role request {request_id} not found")
    if req.status != RequestStatus.pending:
        raise ConflictError("Request already reviewed")

    req.status = new_status
    req.reviewed_by = reviewer.id

    # If approved — promote the user
    if new_status == RequestStatus.approved:
        user_result = await db.execute(select(User).where(User.id == req.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user.role = UserRole.orgs_manager

    await db.commit()
    await db.refresh(req)
    return req
