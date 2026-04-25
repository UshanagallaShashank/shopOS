# Org request routes — users request to create orgs, admins review
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_platform_admin
from models.org_request import RequestStatus
from models.user import User
from schemas.org_request import OrgRequestCreate, OrgRequestResponse, OrgRequestReview
from services import org_request_service

router = APIRouter()


@router.post("/", response_model=OrgRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_org_request(
    data: OrgRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """End user submits a request to create their own org."""
    return await org_request_service.create_org_request(db, current_user, data)


@router.get("/", response_model=list[OrgRequestResponse])
async def list_org_requests(
    status_filter: RequestStatus | None = None,
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """Platform admin lists all org requests."""
    return await org_request_service.list_org_requests(db, status_filter)


@router.get("/my", response_model=list[OrgRequestResponse])
async def get_my_org_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User views their own org requests."""
    return await org_request_service.get_my_org_requests(db, current_user)


@router.patch("/{request_id}", response_model=OrgRequestResponse)
async def review_org_request(
    request_id: uuid.UUID,
    data: OrgRequestReview,
    admin: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    """Platform admin approves or rejects an org request."""
    return await org_request_service.review_org_request(db, request_id, data.status, admin)
