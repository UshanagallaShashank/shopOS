// TypeScript types — mirror the Pydantic schemas in the backend exactly
export type PlanType = "starter" | "pro" | "enterprise"
export type OrgStatus = "active" | "suspended" | "maintenance"

export interface Org {
  id: string
  slug: string
  name: string
  status: OrgStatus
  plan: PlanType
  created_at: string
}

export interface OrgCreate {
  name: string
  slug: string
  plan: PlanType
}

export interface OrgUpdate {
  name?: string
  status?: OrgStatus
  plan?: PlanType
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
  created_at: string
}

export interface ProductCreate {
  org_id: string
  name: string
  price: number
  stock?: number
  category?: string
  description?: string
}

export interface ProductUpdate {
  name?: string
  price?: number
  stock?: number
  is_active?: boolean
}
