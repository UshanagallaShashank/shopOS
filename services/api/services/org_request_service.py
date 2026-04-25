# Org request service — users request to create orgs, admins approve/reject
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.org import Org
from models.org_request import OrgRequest, RequestStatus
from models.user import User, UserRole
from schemas.org_request import OrgRequestCreate
from utils.exceptions import ConflictError, ForbiddenError, NotFoundError


async def create_org_request(
    db: AsyncSession, user: User, data: OrgRequestCreate
) -> OrgRequest:
    """End user submits a request to create their own org."""
    # Only end_user can request (org_admin already has an org)
    if user.role != UserRole.end_user:
        raise ForbiddenError("Only end_user can request to create an org")

    # Check for existing pending request
    existing = await db.execute(
        select(OrgRequest).where(
            OrgRequest.user_id == user.id,
            OrgRequest.status == RequestStatus.pending,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("You already have a pending org request")

    # Check if slug is already taken
    slug_check = await db.execute(select(Org).where(Org.slug == data.org_slug))
    if slug_check.scalar_one_or_none():
        raise ConflictError(f"Slug '{data.org_slug}' is already taken")

    request = OrgRequest(user_id=user.id, **data.model_dump())
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request


async def list_org_requests(
    db: AsyncSession, status_filter: RequestStatus | None = None
) -> list[OrgRequest]:
    """Platform admin lists all org requests."""
    q = select(OrgRequest)
    if status_filter:
        q = q.where(OrgRequest.status == status_filter)
    result = await db.execute(q.order_by(OrgRequest.created_at.desc()))
    requests = list(result.scalars().all())
    
    # Fetch user emails for each request
    for request in requests:
        user_result = await db.execute(select(User).where(User.id == request.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            request.user_email = user.email  # type: ignore
    
    return requests


async def review_org_request(
    db: AsyncSession,
    request_id: uuid.UUID,
    new_status: RequestStatus,
    reviewer: User,
) -> OrgRequest:
    """Platform admin approves or rejects an org request."""
    if reviewer.role != UserRole.platform_admin:
        raise ForbiddenError("Only platform_admin can review org requests")

    result = await db.execute(select(OrgRequest).where(OrgRequest.id == request_id))
    request = result.scalar_one_or_none()
    if not request:
        raise NotFoundError(f"Org request {request_id} not found")
    if request.status != RequestStatus.pending:
        raise ConflictError("Request already reviewed")

    request.status = new_status
    request.reviewed_by = reviewer.id

    # If approved — create the org and assign user as org_admin
    if new_status == RequestStatus.approved:
        # Create the org
        org = Org(
            name=request.org_name,
            slug=request.org_slug,
            plan=request.plan,  # type: ignore
        )
        db.add(org)
        await db.flush()  # get the org.id

        # Assign user as org_admin
        user_result = await db.execute(select(User).where(User.id == request.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user.role = UserRole.org_admin
            user.org_id = org.id

        request.created_org_id = org.id

    await db.commit()
    await db.refresh(request)
    return request


async def get_my_org_requests(db: AsyncSession, user: User) -> list[OrgRequest]:
    """User views their own org requests."""
    result = await db.execute(
        select(OrgRequest)
        .where(OrgRequest.user_id == user.id)
        .order_by(OrgRequest.created_at.desc())
    )
    requests = list(result.scalars().all())
    
    # Add user email to each request
    for request in requests:
        request.user_email = user.email  # type: ignore
    
    return requests
