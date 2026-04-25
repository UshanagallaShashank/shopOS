# Order + OrderItem — one order has many items, always scoped to one org
import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class Order(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "orders"

    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orgs.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus, name="order_status"), default=OrderStatus.pending)
    total: Mapped[float] = mapped_column(Numeric(10, 2))
    razorpay_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)


class OrderItem(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"))
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    price_at_purchase: Mapped[float] = mapped_column(Numeric(10, 2))
