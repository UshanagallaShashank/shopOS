# ShopOS Complete Database Schema

## Overview
This document contains the complete database schema for the ShopOS platform after all improvements.

---

## Tables Summary

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | All user accounts (4 roles) | ✅ Existing |
| `orgs` | Organizations/shops | ✅ Existing |
| `products` | Products for sale | ✅ Enhanced |
| `product_variants` | Color/size variants | ✅ New |
| `product_reviews` | Product ratings | ✅ Existing |
| `orders` | Customer orders | ✅ Enhanced |
| `order_items` | Order line items | ✅ Enhanced |
| `order_queue` | Order processing queue | ✅ New |
| `cart_items` | Persistent cart storage | ✅ New |
| `notifications` | In-app + email notifications | ✅ New |
| `payment_ledger` | Revenue tracking | ✅ New |
| `user_org_access` | User-org many-to-many | ✅ Existing |
| `org_invites` | Invite codes | ✅ Existing |
| `org_requests` | Org creation requests | ✅ Existing |

---

## 1. Users Table

**Purpose**: Store all user accounts across 4 roles

```sql
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Role & Organization
    role user_role NOT NULL DEFAULT 'end_user',
    org_id UUID REFERENCES orgs(id),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_users_firebase_uid (firebase_uid),
    INDEX idx_users_org_id (org_id)
);

-- Enum for user roles
CREATE TYPE user_role AS ENUM (
    'platform_admin',
    'orgs_manager',
    'org_admin',
    'end_user'
);
```

**Columns:**
- `id` - UUID primary key
- `firebase_uid` - Supabase auth user ID (unique)
- `email` - User email address
- `phone` - User phone number
- `role` - User role (enum)
- `org_id` - Primary organization (null for platform roles)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

---

## 2. Organizations (Orgs) Table

**Purpose**: Store shop/organization information

```sql
CREATE TABLE orgs (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Status & Plan
    status org_status NOT NULL DEFAULT 'active',
    plan plan_type NOT NULL DEFAULT 'starter',
    razorpay_sub_id VARCHAR(100),
    
    -- Contact Info
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    
    -- Branding
    logo TEXT,
    category VARCHAR(100),
    ui_template VARCHAR(50),
    primary_color VARCHAR(7),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_orgs_slug (slug),
    INDEX idx_orgs_status (status)
);

-- Enums
CREATE TYPE org_status AS ENUM ('active', 'suspended', 'maintenance');
CREATE TYPE plan_type AS ENUM ('starter', 'pro', 'enterprise');
```

**Columns:**
- `id` - UUID primary key
- `slug` - URL-friendly identifier (unique)
- `name` - Organization name
- `description` - About the organization
- `status` - Active, suspended, or maintenance
- `plan` - Subscription plan
- `razorpay_sub_id` - Razorpay subscription ID
- `email` - Contact email
- `phone` - Contact phone
- `address` - Physical address
- `logo` - Logo image (data URL or S3 URL)
- `category` - Business category
- `ui_template` - Storefront template ID
- `primary_color` - Brand color (hex)

---

## 3. Products Table (Enhanced)

**Purpose**: Store products for sale

```sql
CREATE TABLE products (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization
    org_id UUID NOT NULL REFERENCES orgs(id),
    
    -- Basic Info
    name VARCHAR(300) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Images
    images JSONB NOT NULL DEFAULT '[]',
    
    -- ✨ NEW: Product Attributes
    weight NUMERIC(10, 2),
    dimensions VARCHAR(100),
    material VARCHAR(100),
    brand VARCHAR(100),
    
    -- ✨ NEW: Shipping
    shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    free_shipping_threshold NUMERIC(10, 2),
    estimated_delivery_days INTEGER,
    
    -- ✨ NEW: SEO & Metadata
    tags JSONB NOT NULL DEFAULT '[]',
    meta_title VARCHAR(200),
    meta_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_products_org_id (org_id),
    INDEX idx_products_category (category),
    INDEX idx_products_is_active (is_active)
);
```

**Columns:**
- `id` - UUID primary key
- `org_id` - Organization that owns this product
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `stock` - Available quantity
- `category` - Product category
- `is_active` - Visible on storefront
- `images` - Array of image URLs (JSONB)
- `weight` - Product weight in kg ✨ NEW
- `dimensions` - Dimensions (e.g., "10x20x30 cm") ✨ NEW
- `material` - Material composition ✨ NEW
- `brand` - Brand name ✨ NEW
- `shipping_cost` - Shipping cost ✨ NEW
- `free_shipping_threshold` - Free shipping above this amount ✨ NEW
- `estimated_delivery_days` - Delivery estimate ✨ NEW
- `tags` - Array of tags (JSONB) ✨ NEW
- `meta_title` - SEO title ✨ NEW
- `meta_description` - SEO description ✨ NEW

---

## 4. Product Variants Table (New)

**Purpose**: Store color/size variants for products

```sql
CREATE TABLE product_variants (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Product Reference
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Variant Info
    sku VARCHAR(100) UNIQUE,
    color VARCHAR(50),
    size VARCHAR(50),
    
    -- Pricing & Stock
    price_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Image
    image_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_product_variants_product_id (product_id),
    INDEX idx_product_variants_sku (sku)
);
```

**Columns:**
- `id` - UUID primary key
- `product_id` - Parent product
- `sku` - Stock keeping unit (unique)
- `color` - Variant color
- `size` - Variant size
- `price_adjustment` - Price difference from base (+/-)
- `stock` - Variant-specific stock
- `is_active` - Available for purchase
- `image_url` - Variant-specific image

**Example:**
```json
Product: "T-Shirt" (base price: ₹500)
Variants:
  - { color: "Red", size: "S", price_adjustment: 0, stock: 10 }
  - { color: "Red", size: "M", price_adjustment: 0, stock: 15 }
  - { color: "Blue", size: "L", price_adjustment: 50, stock: 8 }
```

---

## 5. Product Reviews Table

**Purpose**: Store customer product reviews

```sql
CREATE TABLE product_reviews (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_product_reviews_product_id (product_id),
    INDEX idx_product_reviews_user_id (user_id),
    
    -- Constraints
    UNIQUE (product_id, user_id)
);
```

---

## 6. Orders Table (Enhanced)

**Purpose**: Store customer orders

```sql
CREATE TABLE orders (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    org_id UUID NOT NULL REFERENCES orgs(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Order Info
    status order_status NOT NULL DEFAULT 'pending',
    total NUMERIC(10, 2) NOT NULL,
    razorpay_order_id VARCHAR(100),
    
    -- ✨ NEW: Shipping Address
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_pincode VARCHAR(20),
    shipping_phone VARCHAR(20),
    
    -- ✨ NEW: Tracking Info
    tracking_number VARCHAR(100),
    courier_name VARCHAR(100),
    estimated_delivery TIMESTAMP,
    actual_delivery TIMESTAMP,
    
    -- ✨ NEW: Notes
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_orders_org_id (org_id),
    INDEX idx_orders_user_id (user_id),
    INDEX idx_orders_status (status)
);

-- ✨ ENHANCED: Order Status Enum
CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',      -- ✨ NEW
    'shipped',
    'out_for_delivery', -- ✨ NEW
    'delivered',
    'cancelled',
    'refunded'         -- ✨ NEW
);
```

**New Columns:**
- `shipping_address` - Full delivery address ✨
- `shipping_city` - City ✨
- `shipping_state` - State/province ✨
- `shipping_pincode` - ZIP/postal code ✨
- `shipping_phone` - Delivery contact number ✨
- `tracking_number` - Shipment tracking number ✨
- `courier_name` - Delivery service (e.g., "BlueDart") ✨
- `estimated_delivery` - Expected delivery date ✨
- `actual_delivery` - Actual delivery date ✨
- `customer_notes` - Customer instructions ✨
- `admin_notes` - Internal notes ✨

---

## 7. Order Items Table (Enhanced)

**Purpose**: Store individual items in an order

```sql
CREATE TABLE order_items (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id), -- ✨ NEW
    
    -- Item Info
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL,
    
    -- ✨ NEW: Snapshots (preserve data if product deleted)
    product_name VARCHAR(300),
    variant_details VARCHAR(200), -- e.g., "Red, Large"
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_order_items_order_id (order_id),
    INDEX idx_order_items_product_id (product_id)
);
```

**New Columns:**
- `variant_id` - Selected variant (if applicable) ✨
- `product_name` - Product name snapshot ✨
- `variant_details` - Variant info snapshot ✨

---

## 8. Order Queue Table (New)

**Purpose**: Manage concurrent order processing

```sql
CREATE TABLE order_queue (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES orgs(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Queue Info
    status queue_status NOT NULL DEFAULT 'pending',
    position INTEGER NOT NULL,
    
    -- Locking (prevent concurrent processing)
    locked_at TIMESTAMP,
    locked_by UUID REFERENCES users(id),
    
    -- Completion
    completed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_order_queue_order_id (order_id),
    INDEX idx_order_queue_org_id (org_id),
    INDEX idx_order_queue_status (status)
);

CREATE TYPE queue_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);
```

**Purpose:**
- Prevents multiple admins from processing the same order
- Tracks queue position for FIFO processing
- Locks orders during processing

**Workflow:**
1. Order placed → Added to queue with position
2. Admin claims order → `locked_by` set, status = 'processing'
3. Admin completes → status = 'completed', `completed_at` set
4. If admin abandons → Auto-unlock after timeout

---

## 9. Cart Items Table (New)

**Purpose**: Persistent backend cart storage

```sql
CREATE TABLE cart_items (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Cart Info
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_cart_items_user_id (user_id),
    INDEX idx_cart_items_org_id (org_id),
    
    -- Constraints
    UNIQUE (user_id, org_id, product_id, variant_id)
);
```

**Purpose:**
- Persist cart across sessions
- Sync cart across devices
- Recover abandoned carts

---

## 10. Notifications Table (New)

**Purpose**: In-app and email notifications

```sql
CREATE TABLE notifications (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    
    -- Notification Content
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Read Status
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP,
    
    -- Email Status
    email_sent BOOLEAN NOT NULL DEFAULT false,
    email_sent_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read)
);

CREATE TYPE notification_type AS ENUM (
    'order_placed',
    'order_confirmed',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'low_stock',
    'org_request_approved',
    'org_request_rejected',
    'new_review',
    'payment_received'
);
```

**Auto-Trigger Examples:**
- Order placed → Notify user + org_admin
- Order shipped → Notify user with tracking
- Stock < 5 → Notify org_admin
- New review → Notify org_admin

---

## 11. Payment Ledger Table (New)

**Purpose**: Track revenue splits and transactions

```sql
CREATE TABLE payment_ledger (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    org_id UUID NOT NULL REFERENCES orgs(id),
    order_id UUID REFERENCES orders(id),
    user_id UUID REFERENCES users(id),
    
    -- Transaction Info
    transaction_type transaction_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    org_revenue NUMERIC(10, 2) NOT NULL,
    
    -- Payment Gateway
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(200),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_payment_ledger_org_id (org_id),
    INDEX idx_payment_ledger_order_id (order_id)
);

CREATE TYPE transaction_type AS ENUM (
    'order_payment',
    'refund',
    'platform_fee',
    'payout',
    'subscription'
);
```

**Example:**
```sql
-- Order payment: ₹2000
INSERT INTO payment_ledger VALUES (
    transaction_type = 'order_payment',
    amount = 2000,
    platform_fee = 100,  -- 5%
    org_revenue = 1900
);
```

---

## 12. User Org Access Table

**Purpose**: Many-to-many relationship for end_users

```sql
CREATE TABLE user_org_access (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_user_org_access_user_id (user_id),
    INDEX idx_user_org_access_org_id (org_id),
    
    -- Constraints
    UNIQUE (user_id, org_id)
);
```

**Purpose:**
- End users can shop at multiple orgs
- Org admins belong to one org (via `users.org_id`)

---

## 13. Org Invites Table

**Purpose**: Invite codes for joining organizations

```sql
CREATE TABLE org_invites (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    redeemed_by UUID REFERENCES users(id),
    
    -- Invite Info
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    
    -- Status
    redeemed_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_org_invites_code (code),
    INDEX idx_org_invites_org_id (org_id)
);
```

---

## 14. Org Requests Table

**Purpose**: Requests to create new organizations

```sql
CREATE TABLE org_requests (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Requester
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Requested Org Info
    org_name VARCHAR(200) NOT NULL,
    org_slug VARCHAR(100) NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    logo_url TEXT,
    business_docs TEXT,
    description TEXT,
    reason TEXT,
    
    -- Review Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    created_org_id UUID REFERENCES orgs(id),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_org_requests_user_id (user_id),
    INDEX idx_org_requests_status (status)
);
```

---

## Database Relationships Diagram

```
users
  ├─→ orgs (org_id)
  ├─→ orders (user_id)
  ├─→ cart_items (user_id)
  ├─→ notifications (user_id)
  ├─→ product_reviews (user_id)
  └─→ user_org_access (user_id)

orgs
  ├─→ products (org_id)
  ├─→ orders (org_id)
  ├─→ cart_items (org_id)
  ├─→ order_queue (org_id)
  ├─→ payment_ledger (org_id)
  └─→ user_org_access (org_id)

products
  ├─→ product_variants (product_id)
  ├─→ product_reviews (product_id)
  ├─→ order_items (product_id)
  └─→ cart_items (product_id)

orders
  ├─→ order_items (order_id)
  ├─→ order_queue (order_id)
  ├─→ notifications (order_id)
  └─→ payment_ledger (order_id)

product_variants
  ├─→ order_items (variant_id)
  └─→ cart_items (variant_id)
```

---

## Migration Status

| Migration | Status | Description |
|-----------|--------|-------------|
| `f1a2b3c4d5e6` | ✅ Applied | Base schema |
| `g8h9i0j1k2l3` | ✅ Applied | Comprehensive upgrade (variants, cart, notifications, queue, ledger, order enhancements) |
| `h9i0j1k2l3m4` | ✅ Applied | Product columns fix |

**Current Version:** `h9i0j1k2l3m4`

---

## Quick Reference

### Check Current Migration:
```bash
cd services/api
.venv/bin/alembic current
```

### View All Tables:
```sql
\dt
```

### View Table Schema:
```sql
\d products
\d product_variants
\d orders
\d cart_items
\d notifications
\d order_queue
\d payment_ledger
```

### Count Records:
```sql
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM orgs) as orgs,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM product_variants) as variants,
  (SELECT COUNT(*) FROM orders) as orders,
  (SELECT COUNT(*) FROM cart_items) as cart_items,
  (SELECT COUNT(*) FROM notifications) as notifications;
```

---

## Summary of Improvements

### ✨ New Tables (5):
1. `product_variants` - Color/size variants
2. `cart_items` - Backend cart persistence
3. `notifications` - Notification system
4. `order_queue` - Order processing queue
5. `payment_ledger` - Revenue tracking

### 🔄 Enhanced Tables (3):
1. `products` - Added 10 new columns (weight, dimensions, shipping, tags, SEO)
2. `orders` - Added 11 new columns (shipping address, tracking, notes)
3. `order_items` - Added 3 new columns (variant support, snapshots)

### 📊 New Enums (3):
1. `notification_type` - 10 notification types
2. `queue_status` - 4 queue states
3. `transaction_type` - 5 transaction types

### 🎯 Enhanced Enums (1):
1. `order_status` - Added 3 new statuses (processing, out_for_delivery, refunded)

---

**Total Tables:** 14
**Total Columns:** 150+
**Total Indexes:** 40+
**Total Foreign Keys:** 30+

---

This schema supports all 12 platform improvements and is ready for production use! 🚀
