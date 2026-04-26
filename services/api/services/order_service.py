# Order service — creates orders atomically, decrements stock, loads items
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.order import Order, OrderItem, OrderStatus
from models.product import Product
from schemas.order import OrderCreate, OrderUpdate
from utils.exceptions import NotFoundError


async def _load(db: AsyncSession, order_id: uuid.UUID) -> Order:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundError(f"Order {order_id} not found")
    return order


async def list_my_orders(db: AsyncSession, user_id: uuid.UUID) -> list[Order]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def list_orders(db: AsyncSession, org_id: uuid.UUID, skip: int, limit: int) -> list[Order]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.org_id == org_id)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_order(db: AsyncSession, order_id: uuid.UUID) -> Order:
    return await _load(db, order_id)


async def create_order(db: AsyncSession, data: OrderCreate) -> Order:
    # Validate stock and decrement atomically
    product_ids = [item.product_id for item in data.items]
    products_result = await db.execute(
        select(Product).where(Product.id.in_(product_ids))
    )
    products = {p.id: p for p in products_result.scalars().all()}

    for item in data.items:
        product = products.get(item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found",
            )
        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{product.name}' is no longer available",
            )
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Only {product.stock} units of '{product.name}' left in stock",
            )

    order = Order(
        org_id=data.org_id,
        user_id=data.user_id,
        total=data.total,
        shipping_address=data.shipping_address,
        shipping_city=data.shipping_city,
        shipping_state=data.shipping_state,
        shipping_pincode=data.shipping_pincode,
        shipping_phone=data.shipping_phone,
        customer_notes=data.customer_notes,
    )
    db.add(order)
    await db.flush()  # get order.id

    for item in data.items:
        product = products[item.product_id]
        product.stock -= item.quantity  # decrement stock
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            price_at_purchase=item.price_at_purchase,
            product_name=product.name,  # snapshot
        ))

    await db.commit()
    return await _load(db, order.id)


async def update_order_status(db: AsyncSession, order_id: uuid.UUID, new_status: OrderStatus) -> Order:
    order = await _load(db, order_id)
    order.status = new_status
    if new_status == OrderStatus.delivered:
        from datetime import datetime, timezone
        order.actual_delivery = datetime.now(timezone.utc)
    await db.commit()
    return await _load(db, order.id)


async def update_order(db: AsyncSession, order_id: uuid.UUID, data: OrderUpdate) -> Order:
    order = await _load(db, order_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(order, field, value)
    await db.commit()
    return await _load(db, order.id)
