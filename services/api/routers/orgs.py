# Org routes — thin HTTP layer, all logic is in org_service
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from fastapi import HTTPException
from middleware.auth import get_current_user, require_org_manager_or_above, require_platform_admin
from models.user import User, UserRole
from schemas.org import OrgCreate, OrgResponse, OrgUpdate
from services import org_service
from utils.pagination import paginate

router = APIRouter()


@router.get("/", response_model=list[OrgResponse])
async def list_orgs(
    page: dict = Depends(paginate),
    _: User = Depends(require_org_manager_or_above),
    db: AsyncSession = Depends(get_db),
):
    return await org_service.list_orgs(db, page["skip"], page["limit"])


@router.get("/{org_id}", response_model=OrgResponse)
async def get_org(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Permission checks:
    # - platform_admin/orgs_manager: can view any org
    # - org_admin: can only view their own org
    # - end_user: can only view orgs they have access to (via user_org_access table)
    
    if current_user.role == UserRole.platform_admin or current_user.role == UserRole.orgs_manager:
        # Full access
        pass
    elif current_user.role == UserRole.org_admin:
        # Can only view their own org
        if current_user.org_id != org_id:
            raise HTTPException(status_code=403, detail="org_admin can only view their own org")
    elif current_user.role == UserRole.end_user:
        # Can only view orgs they have access to
        from sqlalchemy import select as _select, exists
        from models.user_org_access import UserOrgAccess
        
        result = await db.execute(
            _select(
                exists().where(
                    UserOrgAccess.user_id == current_user.id,
                    UserOrgAccess.org_id == org_id
                )
            )
        )
        has_access = result.scalar()
        if not has_access:
            raise HTTPException(status_code=403, detail="You don't have access to this organization")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    return await org_service.get_org(db, org_id)


@router.post("/", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def create_org(
    data: OrgCreate,
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    return await org_service.create_org(db, data)


@router.patch("/{org_id}", response_model=OrgResponse)
async def update_org(
    org_id: uuid.UUID,
    data: OrgUpdate,
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    return await org_service.update_org(db, org_id, data)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_org(
    org_id: uuid.UUID,
    _: User = Depends(require_platform_admin),
    db: AsyncSession = Depends(get_db),
):
    await org_service.delete_org(db, org_id)
