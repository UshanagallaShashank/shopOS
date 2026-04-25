# Invite routes — create org admin invites, list them, redeem them
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_org_manager_or_above
from models.user import User
from schemas.org_invite import OrgInviteCreate, OrgInviteRedeem, OrgInviteResponse
from services import invite_service

router = APIRouter()


@router.post("/", response_model=OrgInviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite(
    data: OrgInviteCreate,
    creator: User = Depends(require_org_manager_or_above),
    db: AsyncSession = Depends(get_db),
):
    """Create a new invite code for an org. orgs_manager+ only."""
    return await invite_service.create_invite(db, data, creator)


@router.get("/{org_id}", response_model=list[OrgInviteResponse])
async def list_invites(
    org_id: uuid.UUID,
    _: User = Depends(require_org_manager_or_above),
    db: AsyncSession = Depends(get_db),
):
    """List all invites for an org."""
    return await invite_service.list_invites(db, org_id)


@router.post("/redeem", response_model=OrgInviteResponse)
async def redeem_invite(
    data: OrgInviteRedeem,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Redeem an invite code — assigns caller as org_admin for the invite's org."""
    return await invite_service.redeem_invite(db, data.code, current_user)


@router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invite(
    invite_id: uuid.UUID,
    requester: User = Depends(require_org_manager_or_above),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an unused invite."""
    await invite_service.delete_invite(db, invite_id, requester)
