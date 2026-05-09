"""
Notification service — create and send notifications for orders, delivery, etc.
"""
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from models.notification import Notification, NotificationType
from models.order import Order, OrderStatus
from models.user import User
from services import email_service, sms_service


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    order_id: UUID | None = None,
    org_id: UUID | None = None,
    send_email: bool = True,
    send_sms: bool = False,
) -> Notification:
    """
    Create a notification and optionally send via email/SMS
    """
    # Create in-app notification
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        order_id=order_id,
        org_id=org_id,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    
    # Get user for email/SMS
    user = await db.get(User, user_id)
    if not user:
        return notification
    
    # Send email notification
    if send_email and user.email:
        try:
            email_service.send_notification(user.email, title, message)
            notification.email_sent = True
            notification.email_sent_at = datetime.utcnow()
            await db.commit()
        except Exception as e:
            print(f"Failed to send email notification: {e}")
    
    # Send SMS notification
    if send_sms and user.phone:
        try:
            sms_service.send_notification(user.phone, f"{title}: {message}")
        except Exception as e:
            print(f"Failed to send SMS notification: {e}")
    
    return notification


async def notify_order_placed(
    db: AsyncSession,
    order: Order,
    user: User,
) -> Notification:
    """Notify user that their order has been placed"""
    return await create_notification(
        db=db,
        user_id=user.id,
        type=NotificationType.order_placed,
        title="Order Placed Successfully",
        message=f"Your order #{order.id} has been placed successfully. Total: ₹{order.total}",
        order_id=order.id,
        org_id=order.org_id,
        send_email=True,
        send_sms=True,
    )


async def notify_order_confirmed(
    db: AsyncSession,
    order: Order,
    user: User,
) -> Notification:
    """Notify user that their order has been confirmed"""
    return await create_notification(
        db=db,
        user_id=user.id,
        type=NotificationType.order_confirmed,
        title="Order Confirmed",
        message=f"Your order #{order.id} has been confirmed and is being prepared for shipment.",
        order_id=order.id,
        org_id=order.org_id,
        send_email=True,
        send_sms=True,
    )


async def notify_order_shipped(
    db: AsyncSession,
    order: Order,
    user: User,
    tracking_number: str | None = None,
    courier_name: str | None = None,
) -> Notification:
    """Notify user that their order has been shipped"""
    message = f"Your order #{order.id} has been shipped!"
    
    if tracking_number and courier_name:
        message += f" Track your package with {courier_name}: {tracking_number}"
    elif tracking_number:
        message += f" Tracking number: {tracking_number}"
    
    if order.estimated_delivery:
        message += f" Estimated delivery: {order.estimated_delivery.strftime('%B %d, %Y')}"
    
    return await create_notification(
        db=db,
        user_id=user.id,
        type=NotificationType.order_shipped,
        title="Order Shipped! 📦",
        message=message,
        order_id=order.id,
        org_id=order.org_id,
        send_email=True,
        send_sms=True,
    )


async def notify_order_out_for_delivery(
    db: AsyncSession,
    order: Order,
    user: User,
) -> Notification:
    """Notify user that their order is out for delivery"""
    message = f"Your order #{order.id} is out for delivery! It should arrive today."
    
    if order.shipping_address:
        message += f" Delivery address: {order.shipping_address}"
    
    return await create_notification(
        db=db,
        user_id=user.id,
        type=NotificationType.order_shipped,  # Reuse shipped type
        title="Out for Delivery! 🚚",
        message=message,
        order_id=order.id,
        org_id=order.org_id,
        send_email=True,
        send_sms=True,
    )


async def notify_order_delivered(
    db: AsyncSession,
    order: Order,
    user: User,
) -> Notification:
    """Notify user that their order has been delivered"""
    return await create_notification(
        db=db,
        user_id=user.id,
        type=NotificationType.order_delivered,
        title="Order Delivered! ✅",
        message=f"Your order #{order.id} has been delivered successfully. Thank you for shopping with us!",
        order_id=order.id,
        org_id=order.org_id,
        send_email=True,
        send_sms=True,
    )


async def notify_order_cancelled(
    db: AsyncSession,
    order: Order,
    user: User,
    reason: str | None = None,
) -> Notification:
    """Notify user that their order has been cancelled"""
    message = f"Your order #{order.id} has been cancelled."
    
    if reason:
        message += f" Reason: {reason}"
    
    message += " If you have any questions, please contact support."
    
    return await create_notification(
        db=db,
        user_id=user.id,
        type=NotificationType.order_cancelled,
        title="Order Cancelled",
        message=message,
        order_id=order.id,
        org_id=order.org_id,
        send_email=True,
        send_sms=False,
    )


async def notify_on_order_status_change(
    db: AsyncSession,
    order: Order,
    user: User,
    old_status: OrderStatus,
    new_status: OrderStatus,
) -> Notification | None:
    """
    Automatically send notification when order status changes
    Call this from the order update endpoint
    """
    # Skip if status didn't actually change
    if old_status == new_status:
        return None
    
    # Map status changes to notification functions
    if new_status == OrderStatus.confirmed:
        return await notify_order_confirmed(db, order, user)
    elif new_status == OrderStatus.shipped:
        return await notify_order_shipped(
            db, order, user,
            tracking_number=order.tracking_number,
            courier_name=order.courier_name
        )
    elif new_status == OrderStatus.out_for_delivery:
        return await notify_order_out_for_delivery(db, order, user)
    elif new_status == OrderStatus.delivered:
        return await notify_order_delivered(db, order, user)
    elif new_status == OrderStatus.cancelled:
        return await notify_order_cancelled(db, order, user)
    
    return None


async def notify_low_stock(
    db: AsyncSession,
    admin_user_id: UUID,
    product_name: str,
    current_stock: int,
    org_id: UUID,
) -> Notification:
    """Notify admin that a product is low on stock"""
    return await create_notification(
        db=db,
        user_id=admin_user_id,
        type=NotificationType.low_stock,
        title="Low Stock Alert",
        message=f"Product '{product_name}' is running low on stock. Current stock: {current_stock}",
        org_id=org_id,
        send_email=True,
        send_sms=False,
    )


async def notify_payment_received(
    db: AsyncSession,
    user_id: UUID,
    order_id: UUID,
    amount: float,
    org_id: UUID,
) -> Notification:
    """Notify user that payment has been received"""
    return await create_notification(
        db=db,
        user_id=user_id,
        type=NotificationType.payment_received,
        title="Payment Received",
        message=f"We have received your payment of ₹{amount}. Your order is being processed.",
        order_id=order_id,
        org_id=org_id,
        send_email=True,
        send_sms=False,
    )
