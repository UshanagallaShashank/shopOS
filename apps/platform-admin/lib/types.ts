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
  created_at: string
}

export interface OrgCreate { name: string; slug: string; plan: PlanType }
export interface OrgUpdate { name?: string; status?: OrgStatus; plan?: PlanType }

export interface Product {
  id: string
  org_id: string
  name: string
  description: string | null
  price: number
  stock: number
  category: string | null
  is_active: boolean
  created_at: string
}

export interface ProductCreate {
  org_id: string; name: string; price: number
  stock?: number; category?: string; description?: string
}
export interface ProductUpdate {
  name?: string; price?: number; stock?: number; is_active?: boolean; description?: string; category?: string
}

export interface User {
  id: string
  firebase_uid: string
  email: string | null
  phone: string | null
  role: UserRole
  org_id: string | null
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
