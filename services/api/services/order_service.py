# Order service — creates orders with items atomically, updates status
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.order import Order, OrderItem, OrderStatus
from schemas.order import OrderCreate
from utils.exceptions import NotFoundError


async def list_orders(db: AsyncSession, org_id: uuid.UUID, skip: int, limit: int) -> list[Order]:
    result = await db.execute(
        select(Order).where(Order.org_id == org_id).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def get_order(db: AsyncSession, order_id: uuid.UUID) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundError(f"Order {order_id} not found")
    return order


async def create_order(db: AsyncSession, data: OrderCreate) -> Order:
    order = Order(org_id=data.org_id, user_id=data.user_id, total=data.total)
    db.add(order)
    await db.flush()  # get order.id without committing — items need it as FK
    for item in data.items:
        db.add(OrderItem(order_id=order.id, **item.model_dump()))
    await db.commit()
    await db.refresh(order)
    return order


async def update_order_status(db: AsyncSession, order_id: uuid.UUID, new_status: OrderStatus) -> Order:
    order = await get_order(db, order_id)
    order.status = new_status
    await db.commit()
    await db.refresh(order)
    return order
