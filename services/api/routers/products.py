# Product routes — requires org_id as query param on list to enforce tenant scope
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_org_admin_or_above
from models.user import User
from schemas.product import ProductCreate, ProductResponse, ProductUpdate
from services import product_service
from utils.pagination import paginate

router = APIRouter()


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    org_id: uuid.UUID,
    page: dict = Depends(paginate),
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await product_service.list_products(db, org_id, page["skip"], page["limit"])


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await product_service.get_product(db, product_id)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    _: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    return await product_service.create_product(db, data)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    _: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    return await product_service.update_product(db, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    _: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    await product_service.delete_product(db, product_id)
