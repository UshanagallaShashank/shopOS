// TypeScript types — mirror the Pydantic schemas in the backend exactly
export type PlanType = "starter" | "pro" | "enterprise"
export type OrgStatus = "active" | "suspended" | "maintenance"
export type UserRole = "platform_admin" | "orgs_manager" | "org_admin" | "end_user"
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"

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
  avg_rating: number | null
  review_count: number
  created_at: string
}

export interface ProductCreate {
  org_id: string; name: string; price: number
  stock?: number; category?: string; description?: string
  images?: string[]
}
export interface ProductUpdate {
  name?: string; price?: number; stock?: number; is_active?: boolean
  description?: string; category?: string; images?: string[]
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

export interface Order {
  id: string
  org_id: string
  user_id: string
  status: OrderStatus
  total: number
  razorpay_order_id: string | null
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
