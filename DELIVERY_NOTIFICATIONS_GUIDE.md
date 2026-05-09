# Delivery & Order Notifications System

## 📱 Overview

The ShopOS platform has a **complete notification system** for delivery tracking and order updates. Notifications are sent through **3 channels**:

1. **In-App Notifications** - Visible in the app (bell icon)
2. **Email Notifications** - Sent via Resend
3. **SMS Notifications** - Sent via Twilio

---

## ✅ What's Already Implemented

### 1. Database Schema ✅
- **`notifications` table** with all fields
- **Notification types**:
  - `order_placed` - Order created
  - `order_confirmed` - Store confirmed order
  - `order_shipped` - Order dispatched
  - `order_delivered` - Order delivered
  - `order_cancelled` - Order cancelled
  - `low_stock` - Product low on stock (admin)
  - `org_request_approved` - Store request approved
  - `org_request_rejected` - Store request rejected
  - `new_review` - New product review
  - `payment_received` - Payment confirmed

### 2. API Endpoints ✅
- `GET /notifications` - List user's notifications
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/{id}/read` - Mark as read
- `POST /notifications/read-all` - Mark all as read

### 3. Notification Service ✅
**File**: `services/api/services/notification_service.py`

**Functions**:
- `notify_order_placed()` - Order placed notification
- `notify_order_confirmed()` - Order confirmed
- `notify_order_shipped()` - Order shipped with tracking
- `notify_order_out_for_delivery()` - Out for delivery
- `notify_order_delivered()` - Delivered
- `notify_order_cancelled()` - Cancelled
- `notify_on_order_status_change()` - Auto-notify on status change
- `notify_low_stock()` - Low stock alert
- `notify_payment_received()` - Payment received

### 4. Email Templates ✅
**File**: `services/api/services/email_service.py`

**Templates**:
- `order_placed()` - Beautiful HTML email
- `order_confirmed()` - Confirmation email
- `order_shipped()` - Shipping notification with tracking
- `order_delivered()` - Delivery confirmation
- `order_cancelled()` - Cancellation notice
- `send_notification()` - Generic notification

### 5. SMS Templates ✅
**File**: `services/api/services/sms_service.py`

**Templates**:
- `order_placed()` - Order placed SMS
- `order_confirmed()` - Confirmation SMS
- `order_shipped()` - Shipping SMS with tracking
- `order_delivered()` - Delivery SMS
- `order_cancelled()` - Cancellation SMS
- `send_notification()` - Generic SMS

---

## 🚀 How to Use

### Automatic Notifications on Order Status Change

Add this to your order update endpoint:

```python
from services import notification_service
from models.order import OrderStatus

# In your order update endpoint
@router.patch("/orders/{order_id}")
async def update_order(
    order_id: UUID,
    status: OrderStatus,
    tracking_number: str | None = None,
    courier_name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get order
    order = await db.get(Order, order_id)
    old_status = order.status
    
    # Update order
    order.status = status
    if tracking_number:
        order.tracking_number = tracking_number
    if courier_name:
        order.courier_name = courier_name
    
    await db.commit()
    await db.refresh(order)
    
    # Get user
    user = await db.get(User, order.user_id)
    
    # Send notification automatically
    await notification_service.notify_on_order_status_change(
        db=db,
        order=order,
        user=user,
        old_status=old_status,
        new_status=status
    )
    
    return order
```

### Manual Notifications

```python
from services import notification_service

# When order is placed
await notification_service.notify_order_placed(db, order, user)

# When order is shipped
await notification_service.notify_order_shipped(
    db=db,
    order=order,
    user=user,
    tracking_number="TRK123456789",
    courier_name="BlueDart"
)

# When order is delivered
await notification_service.notify_order_delivered(db, order, user)
```

---

## 📧 Email Configuration

### Setup Resend (Email Provider)

1. **Sign up**: https://resend.com
2. **Get API key**: Dashboard → API Keys
3. **Add to `.env`**:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=ShopOS <noreply@yourdomain.com>
   ```
4. **Verify domain** (optional, for production):
   - Add DNS records in Resend dashboard
   - Use verified domain in `EMAIL_FROM`

### Test Email

```bash
cd services/api
.venv/bin/python -c "
from services import email_service
email_service.order_shipped(
    'test@example.com',
    'abc123',
    'BlueDart',
    'TRK123456789'
)
print('Email sent!')
"
```

---

## 📱 SMS Configuration

### Setup Twilio (SMS Provider)

1. **Sign up**: https://www.twilio.com/try-twilio
2. **Get credentials**: Console → Account Info
3. **Get phone number**: Phone Numbers → Buy a number
4. **Add to `.env`**:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_FROM_NUMBER=+15551234567
   ```

### Test SMS

```bash
cd services/api
.venv/bin/python -c "
from services import sms_service
sms_service.order_shipped(
    '+918523060395',
    'abc123',
    'BlueDart',
    'TRK123456789'
)
print('SMS sent!')
"
```

---

## 🎨 Frontend Integration

### Display Notifications in Header

```typescript
// In your header component
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function NotificationBell() {
  const { data: count } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count'),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
  
  return (
    <button className="relative">
      <Bell className="h-5 w-5" />
      {count?.count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {count.count}
        </span>
      )}
    </button>
  )
}
```

### Notifications Page

```typescript
// apps/platform-admin/app/notifications/page.tsx
'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export default function NotificationsPage() {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
  })
  
  const markAsRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`)
    // Refetch notifications
  }
  
  return (
    <div>
      <h1>Notifications</h1>
      {notifications?.map((notif) => (
        <div key={notif.id} className={notif.is_read ? 'opacity-50' : ''}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          {!notif.is_read && (
            <button onClick={() => markAsRead(notif.id)}>
              Mark as read
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## 🔔 Notification Flow

### Order Lifecycle

```
1. Customer places order
   → notify_order_placed()
   → Email + SMS + In-app notification

2. Store confirms order
   → notify_order_confirmed()
   → Email + SMS + In-app notification

3. Store ships order
   → notify_order_shipped()
   → Email + SMS + In-app notification
   → Includes tracking number and courier

4. Order out for delivery
   → notify_order_out_for_delivery()
   → Email + SMS + In-app notification

5. Order delivered
   → notify_order_delivered()
   → Email + SMS + In-app notification
```

---

## 📊 Notification Types

| Type | Recipient | Email | SMS | In-App |
|------|-----------|-------|-----|--------|
| Order Placed | Customer | ✅ | ✅ | ✅ |
| Order Confirmed | Customer | ✅ | ✅ | ✅ |
| Order Shipped | Customer | ✅ | ✅ | ✅ |
| Out for Delivery | Customer | ✅ | ✅ | ✅ |
| Order Delivered | Customer | ✅ | ✅ | ✅ |
| Order Cancelled | Customer | ✅ | ❌ | ✅ |
| Low Stock | Admin | ✅ | ❌ | ✅ |
| Payment Received | Customer | ✅ | ❌ | ✅ |

---

## 🎯 Next Steps

### 1. Integrate with Order Endpoints
Add notification calls to:
- `POST /orders` - Create order
- `PATCH /orders/{id}` - Update order status
- `PATCH /orders/{id}/tracking` - Update tracking info

### 2. Add Frontend UI
- Notification bell in header
- Notifications page
- Real-time updates (optional: WebSocket)

### 3. Configure Email & SMS
- Set up Resend for emails
- Set up Twilio for SMS
- Test notifications

### 4. Add More Notification Types
- New product available
- Price drop alerts
- Wishlist item back in stock
- Order review reminders

---

## 🧪 Testing

### Test Notification Creation

```bash
cd services/api
.venv/bin/python -c "
import asyncio
from database import SessionLocal
from services import notification_service
from models.notification import NotificationType
from uuid import UUID

async def test():
    async with SessionLocal() as db:
        # Replace with real user_id
        user_id = UUID('2bfcba86-3cbb-4aff-b067-0ea02ab8bf75')
        
        notif = await notification_service.create_notification(
            db=db,
            user_id=user_id,
            type=NotificationType.order_shipped,
            title='Test Notification',
            message='This is a test delivery notification!',
            send_email=True,
            send_sms=True
        )
        print(f'Created notification: {notif.id}')

asyncio.run(test())
"
```

---

## 📝 Summary

✅ **Database**: Complete with all notification types
✅ **API**: All endpoints implemented
✅ **Service**: Notification service with all functions
✅ **Email**: Beautiful HTML templates
✅ **SMS**: Concise SMS templates
⏭️ **Integration**: Need to add to order endpoints
⏭️ **Frontend**: Need to build notification UI

**Everything is ready to use!** Just integrate the notification service into your order management endpoints and configure email/SMS providers.

---

**Last Updated**: April 27, 2026
**Status**: ✅ Ready for integration
