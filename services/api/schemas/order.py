# Pydantic schemas for Order and OrderItem
import uuid
from datetime import datetime

from pydantic import BaseModel

from models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int
    price_at_purchase: float  # snapshot price — avoids issues if price changes later


class OrderCreate(BaseModel):
    org_id: uuid.UUID
    user_id: uuid.UUID
    items: list[OrderItemCreate]
    total: float


class OrderResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    user_id: uuid.UUID
    status: OrderStatus
    total: float
    razorpay_order_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
