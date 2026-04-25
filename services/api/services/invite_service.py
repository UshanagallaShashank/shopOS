# Invite service — create and redeem org admin invites
import random
import string
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.org_invite import OrgInvite
from models.user import User, UserRole
from schemas.org_invite import OrgInviteCreate
from utils.exceptions import ConflictError, ForbiddenError, NotFoundError


def _generate_code(length: int = 8) -> str:
    """Generate a short uppercase alphanumeric code like 'A3X9KP2M'."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


async def create_invite(
    db: AsyncSession, data: OrgInviteCreate, creator: User
) -> OrgInvite:
    """Create a new invite code for an org. Only orgs_manager+ can do this."""
    if creator.role not in (UserRole.platform_admin, UserRole.orgs_manager):
        raise ForbiddenError("Only orgs_manager or platform_admin can create invites")

    # Generate a unique code (retry on collision — extremely rare)
    for _ in range(5):
        code = _generate_code()
        existing = await db.execute(select(OrgInvite).where(OrgInvite.code == code))
        if not existing.scalar_one_or_none():
            break
    else:
        raise ConflictError("Could not generate a unique invite code, try again")

    invite = OrgInvite(
        org_id=data.org_id,
        code=code,
        email=data.email,
        created_by=creator.id,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


async def list_invites(db: AsyncSession, org_id: uuid.UUID) -> list[OrgInvite]:
    result = await db.execute(
        select(OrgInvite)
        .where(OrgInvite.org_id == org_id)
        .order_by(OrgInvite.created_at.desc())
    )
    return list(result.scalars().all())


async def redeem_invite(db: AsyncSession, code: str, user: User) -> OrgInvite:
    """
    Redeem an invite code — assigns the user as org_admin for the invite's org.
    Called during signup or from the dashboard.
    """
    result = await db.execute(select(OrgInvite).where(OrgInvite.code == code.upper().strip()))
    invite = result.scalar_one_or_none()

    if not invite:
        raise NotFoundError("Invalid invite code")

    if invite.redeemed_by is not None:
        raise ConflictError("This invite code has already been used")

    now = datetime.now(timezone.utc)
    if invite.expires_at.replace(tzinfo=timezone.utc) < now:
        raise ConflictError("This invite code has expired")

    # If the invite was restricted to a specific email, enforce it
    if invite.email and invite.email.lower() != (user.email or "").lower():
        raise ForbiddenError(f"This invite is for {invite.email}")

    # Assign the user as org_admin for this org
    user.role = UserRole.org_admin
    user.org_id = invite.org_id

    # Mark invite as redeemed
    invite.redeemed_by = user.id
    invite.redeemed_at = now

    await db.commit()
    await db.refresh(invite)
    return invite


async def delete_invite(db: AsyncSession, invite_id: uuid.UUID, requester: User) -> None:
    result = await db.execute(select(OrgInvite).where(OrgInvite.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise NotFoundError("Invite not found")
    if requester.role not in (UserRole.platform_admin, UserRole.orgs_manager):
        raise ForbiddenError("Not allowed")
    await db.delete(invite)
    await db.commit()
