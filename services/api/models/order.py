# Order + OrderItem — one order has many items, always scoped to one org
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"
    refunded = "refunded"


class Order(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "orders"

    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orgs.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus, name="order_status"), default=OrderStatus.pending)
    total: Mapped[float] = mapped_column(Numeric(10, 2))
    razorpay_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Delivery information
    shipping_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    shipping_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    shipping_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    shipping_pincode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    shipping_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    # Tracking information
    tracking_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    courier_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    estimated_delivery: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_delivery: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Notes
    customer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["OrderItem"]] = relationship("OrderItem", lazy="noload", cascade="all, delete-orphan")


class OrderItem(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"))
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"))
    variant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id"), nullable=True
    )
    quantity: Mapped[int] = mapped_column(Integer)
    price_at_purchase: Mapped[float] = mapped_column(Numeric(10, 2))
    
    # Snapshot of product details at purchase time
    product_name: Mapped[str | None] = mapped_column(String(300), nullable=True)
    variant_details: Mapped[str | None] = mapped_column(String(200), nullable=True)  # e.g., "Red, Large"
