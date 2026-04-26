# Order Queue — manage concurrent orders and prevent double-booking
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class QueueStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class OrderQueue(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "order_queue"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, index=True
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orgs.id"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    
    status: Mapped[QueueStatus] = mapped_column(
        Enum(QueueStatus, name="queue_status"), default=QueueStatus.pending
    )
    position: Mapped[int] = mapped_column(Integer)  # Queue position
    
    locked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    locked_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )  # Admin processing this order
    
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
