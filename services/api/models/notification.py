# Notifications — in-app and email notifications
import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class NotificationType(str, enum.Enum):
    order_placed = "order_placed"
    order_confirmed = "order_confirmed"
    order_shipped = "order_shipped"
    order_delivered = "order_delivered"
    order_cancelled = "order_cancelled"
    low_stock = "low_stock"
    org_request_approved = "org_request_approved"
    org_request_rejected = "org_request_rejected"
    new_review = "new_review"
    payment_received = "payment_received"


class Notification(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type")
    )
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    
    # Related entities
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=True
    )
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orgs.id", ondelete="CASCADE"), nullable=True
    )
    
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Email tracking
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    email_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
