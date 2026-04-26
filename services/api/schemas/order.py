# Pydantic schemas for Order and OrderItem
import uuid
from datetime import datetime

from pydantic import BaseModel

from models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID | None = None
    quantity: int
    price_at_purchase: float


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    product_id: uuid.UUID
    variant_id: uuid.UUID | None
    quantity: int
    price_at_purchase: float
    product_name: str | None
    variant_details: str | None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    org_id: uuid.UUID
    user_id: uuid.UUID
    items: list[OrderItemCreate]
    total: float
    shipping_address: str | None = None
    shipping_city: str | None = None
    shipping_state: str | None = None
    shipping_pincode: str | None = None
    shipping_phone: str | None = None
    customer_notes: str | None = None


class OrderUpdate(BaseModel):
    tracking_number: str | None = None
    courier_name: str | None = None
    estimated_delivery: datetime | None = None
    admin_notes: str | None = None


class OrderResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    user_id: uuid.UUID
    status: OrderStatus
    total: float
    razorpay_order_id: str | None
    shipping_address: str | None
    shipping_city: str | None
    shipping_state: str | None
    shipping_pincode: str | None
    shipping_phone: str | None
    tracking_number: str | None
    courier_name: str | None
    estimated_delivery: datetime | None
    actual_delivery: datetime | None
    customer_notes: str | None
    admin_notes: str | None
    items: list[OrderItemResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
