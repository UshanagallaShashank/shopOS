# Order routes — CRUD + status management
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user, require_org_admin_or_above
from models.order import OrderStatus
from models.user import User
from schemas.order import OrderCreate, OrderResponse, OrderUpdate
from services import order_service
from utils.pagination import paginate

router = APIRouter()


@router.get("/my", response_model=list[OrderResponse])
async def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.list_my_orders(db, current_user.id)


@router.get("/", response_model=list[OrderResponse])
async def list_orders(
    org_id: uuid.UUID,
    page: dict = Depends(paginate),
    _: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.list_orders(db, org_id, page["skip"], page["limit"])


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.get_order(db, order_id)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data.user_id = current_user.id
    return await order_service.create_order(db, data)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: uuid.UUID,
    new_status: OrderStatus,
    _: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.update_order_status(db, order_id, new_status)


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: uuid.UUID,
    data: OrderUpdate,
    _: User = Depends(require_org_admin_or_above),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.update_order(db, order_id, data)
