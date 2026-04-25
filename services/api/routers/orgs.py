# Org routes — thin HTTP layer, all logic is in org_service
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.org import OrgCreate, OrgResponse, OrgUpdate
from services import org_service
from utils.pagination import paginate

router = APIRouter()


@router.get("/", response_model=list[OrgResponse])
async def list_orgs(page: dict = Depends(paginate), db: AsyncSession = Depends(get_db)):
    return await org_service.list_orgs(db, page["skip"], page["limit"])


@router.get("/{org_id}", response_model=OrgResponse)
async def get_org(org_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await org_service.get_org(db, org_id)


@router.post("/", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def create_org(data: OrgCreate, db: AsyncSession = Depends(get_db)):
    return await org_service.create_org(db, data)


@router.patch("/{org_id}", response_model=OrgResponse)
async def update_org(org_id: uuid.UUID, data: OrgUpdate, db: AsyncSession = Depends(get_db)):
    return await org_service.update_org(db, org_id, data)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_org(org_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await org_service.delete_org(db, org_id)
