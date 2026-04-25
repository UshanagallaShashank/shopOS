# User service — registration with secret-key role assignment
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.user import User, UserRole
from models.user_org_access import UserOrgAccess
from schemas.user import UserCreate, UserRegister, UserUpdate
from utils.exceptions import ConflictError, ForbiddenError, NotFoundError


async def _attach_accessible_orgs(db: AsyncSession, user: User) -> User:
    """Populate the transient accessible_org_ids attribute on a User instance."""
    result = await db.execute(
        select(UserOrgAccess.org_id).where(UserOrgAccess.user_id == user.id)
    )
    user.accessible_org_ids = [row[0] for row in result.all()]
    return user


async def list_users(db: AsyncSession, skip: int, limit: int, org_id: uuid.UUID | None = None) -> list[User]:
    q = select(User)
    if org_id is not None:
        q = q.where(User.org_id == org_id)
    result = await db.execute(q.offset(skip).limit(limit))
    users = list(result.scalars().all())
    for u in users:
        await _attach_accessible_orgs(db, u)
    return users


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError(f"User {user_id} not found")
    await _attach_accessible_orgs(db, user)
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
        await _attach_accessible_orgs(db, found)
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
    await _attach_accessible_orgs(db, user)
    return user


async def grant_org_access(db: AsyncSession, user_id: uuid.UUID, org_id: uuid.UUID) -> None:
    """Grant a user access to an org (idempotent)."""
    existing = await db.execute(
        select(UserOrgAccess).where(
            UserOrgAccess.user_id == user_id,
            UserOrgAccess.org_id == org_id,
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(UserOrgAccess(user_id=user_id, org_id=org_id))
        await db.commit()


async def revoke_org_access(db: AsyncSession, user_id: uuid.UUID, org_id: uuid.UUID) -> None:
    """Revoke a user's access to an org."""
    await db.execute(
        delete(UserOrgAccess).where(
            UserOrgAccess.user_id == user_id,
            UserOrgAccess.org_id == org_id,
        )
    )
    await db.commit()


async def set_org_access(db: AsyncSession, user_id: uuid.UUID, org_ids: list[uuid.UUID]) -> None:
    """Replace a user's full org access list with the provided set."""
    await db.execute(delete(UserOrgAccess).where(UserOrgAccess.user_id == user_id))
    for org_id in org_ids:
        db.add(UserOrgAccess(user_id=user_id, org_id=org_id))
    await db.commit()


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    existing = await db.execute(select(User).where(User.firebase_uid == data.firebase_uid))
    if existing.scalar_one_or_none():
        raise ConflictError(f"User '{data.firebase_uid}' already exists")
    user = User(**data.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    # accessible_org_ids not relevant for newly-created users
    user.accessible_org_ids = []
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

