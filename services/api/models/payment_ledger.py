# Payment Ledger — track revenue splits between org and platform
import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database import Base
from models.base import Timestamps, UUIDPrimaryKey


class TransactionType(str, enum.Enum):
    order_payment = "order_payment"
    refund = "refund"
    platform_fee = "platform_fee"
    payout = "payout"
    subscription = "subscription"


class PaymentLedger(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "payment_ledger"

    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orgs.id"), index=True
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type")
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    platform_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    org_revenue: Mapped[float] = mapped_column(Numeric(10, 2))
    
    payment_gateway: Mapped[str | None] = mapped_column(String(50), nullable=True)  # razorpay, stripe
    gateway_transaction_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
