# Order routes — create orders and update status (e.g. shipped, delivered)
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.order import OrderStatus
from schemas.order import OrderCreate, OrderResponse
from services import order_service
from utils.pagination import paginate

router = APIRouter()


@router.get("/", response_model=list[OrderResponse])
async def list_orders(
    org_id: uuid.UUID, page: dict = Depends(paginate), db: AsyncSession = Depends(get_db)
):
    return await order_service.list_orders(db, org_id, page["skip"], page["limit"])


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await order_service.get_order(db, order_id)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(data: OrderCreate, db: AsyncSession = Depends(get_db)):
    return await order_service.create_order(db, data)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: uuid.UUID, new_status: OrderStatus, db: AsyncSession = Depends(get_db)
):
    return await order_service.update_order_status(db, order_id, new_status)
