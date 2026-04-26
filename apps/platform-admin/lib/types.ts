// TypeScript types — mirror the Pydantic schemas in the backend exactly
export type PlanType = "starter" | "pro" | "enterprise"
export type OrgStatus = "active" | "suspended" | "maintenance"
export type UserRole = "platform_admin" | "orgs_manager" | "org_admin" | "end_user"
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "refunded"
export type NotificationType = "order_placed" | "order_confirmed" | "order_shipped" | "order_delivered" | "order_cancelled" | "low_stock" | "org_request_approved" | "org_request_rejected" | "new_review" | "payment_received"

export interface Org {
  id: string
  slug: string
  name: string
  status: OrgStatus
  plan: PlanType
  description: string | null
  email: string | null
  phone: string | null
  address: string | null
  logo: string | null
  category: string | null
  ui_template: string | null
  primary_color: string | null
  created_at: string
}

export interface OrgCreate {
  name: string; slug: string; plan: PlanType
  description?: string; email?: string; phone?: string
  address?: string; logo?: string; category?: string
}
export interface OrgUpdate {
  name?: string; status?: OrgStatus; plan?: PlanType
  description?: string; email?: string; phone?: string
  address?: string; logo?: string; category?: string
  ui_template?: string; primary_color?: string
}

export interface OrgUIUpdate {
  ui_template?: string | null
  primary_color?: string | null
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string | null
  color: string | null
  size: string | null
  price_adjustment: number
  stock: number
  is_active: boolean
  image_url: string | null
  created_at: string
}

export interface ProductVariantCreate {
  sku?: string
  color?: string
  size?: string
  price_adjustment?: number
  stock?: number
  image_url?: string
}

export interface Product {
  id: string
  org_id: string
  name: string
  description: string | null
  price: number
  stock: number
  category: string | null
  is_active: boolean
  images: string[]
  weight: number | null
  dimensions: string | null
  material: string | null
  brand: string | null
  shipping_cost: number
  free_shipping_threshold: number | null
  estimated_delivery_days: number | null
  tags: string[]
  meta_title: string | null
  meta_description: string | null
  avg_rating: number | null
  review_count: number
  variants?: ProductVariant[]
  created_at: string
}

export interface ProductCreate {
  org_id: string; name: string; price: number
  stock?: number; category?: string; description?: string
  images?: string[]
  weight?: number; dimensions?: string; material?: string; brand?: string
  shipping_cost?: number; free_shipping_threshold?: number
  estimated_delivery_days?: number; tags?: string[]
  meta_title?: string; meta_description?: string
}
export interface ProductUpdate {
  name?: string; price?: number; stock?: number; is_active?: boolean
  description?: string; category?: string; images?: string[]
  weight?: number; dimensions?: string; material?: string; brand?: string
  shipping_cost?: number; free_shipping_threshold?: number
  estimated_delivery_days?: number; tags?: string[]
  meta_title?: string; meta_description?: string
}

export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  user_email: string | null
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface ReviewCreate { rating: number; comment?: string }
export interface ReviewUpdate { rating?: number; comment?: string }

export interface User {
  id: string
  firebase_uid: string
  email: string | null
  phone: string | null
  role: UserRole
  org_id: string | null
  accessible_org_ids: string[]
  created_at: string
}

export interface UserCreate {
  firebase_uid: string
  email?: string
  phone?: string
  role: UserRole
  org_id?: string
}

export interface UserUpdate {
  role?: UserRole
  org_id?: string
  clear_org?: boolean
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price_at_purchase: number
  product_name: string | null
  variant_details: string | null
}

export interface Order {
  id: string
  org_id: string
  user_id: string
  status: OrderStatus
  total: number
  razorpay_order_id: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pincode: string | null
  shipping_phone: string | null
  tracking_number: string | null
  courier_name: string | null
  estimated_delivery: string | null
  actual_delivery: string | null
  customer_notes: string | null
  admin_notes: string | null
  items?: OrderItem[]
  created_at: string
}

export interface OrderCreate {
  org_id: string
  user_id: string
  items: {
    product_id: string
    variant_id?: string
    quantity: number
    price_at_purchase: number
  }[]
  total: number
  shipping_address?: string
  shipping_city?: string
  shipping_state?: string
  shipping_pincode?: string
  shipping_phone?: string
  customer_notes?: string
}

export interface OrderUpdate {
  status?: OrderStatus
  tracking_number?: string
  courier_name?: string
  estimated_delivery?: string
  admin_notes?: string
}

export interface CartItem {
  id: string
  user_id: string
  org_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  product?: Product
  variant?: ProductVariant
  created_at: string
}

export interface CartItemCreate {
  product_id: string
  variant_id?: string
  quantity: number
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  order_id: string | null
  org_id: string | null
  is_read: boolean
  read_at: string | null
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
}

export interface PaymentLedger {
  id: string
  org_id: string
  order_id: string | null
  user_id: string | null
  transaction_type: "order_payment" | "refund" | "platform_fee" | "payout" | "subscription"
  amount: number
  platform_fee: number
  org_revenue: number
  payment_gateway: string | null
  gateway_transaction_id: string | null
  notes: string | null
  created_at: string
}

export interface OrgInvite {
  id: string
  org_id: string
  code: string
  email: string | null
  created_by: string
  redeemed_by: string | null
  redeemed_at: string | null
  expires_at: string
  created_at: string
}

export interface OrgInviteCreate {
  org_id: string
  email?: string
}

export interface OrgRequest {
  id: string
  user_id: string
  user_email?: string | null
  org_name: string
  org_slug: string
  plan: string
  logo_url: string | null
  business_docs: string | null
  description: string | null
  reason: string | null
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  created_org_id: string | null
  created_at: string
  updated_at: string
}

export interface OrgRequestCreate {
  org_name: string
  org_slug: string
  plan?: string
  logo_url?: string
  business_docs?: string
  description?: string
  reason?: string
}
