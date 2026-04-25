// API client — thin fetch wrapper, all routes in one place
import type {
  Org, OrgCreate, OrgUpdate,
  Product, ProductCreate, ProductUpdate,
  User, UserCreate, UserUpdate, Order,
  OrgInvite, OrgInviteCreate,
} from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("shopos_token")
    ?? document.cookie.match(/shopos_token=([^;]+)/)?.[1]
    ?? null
  console.log("[API] Getting token:", token ? `${token.substring(0, 20)}...` : "NO TOKEN")
  return token
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  console.log("[API] Making request to:", path, "with token:", !!token)
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })
  console.log("[API] Response status:", res.status, "for:", path)
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

// Builds ?key=value query string, skips undefined values
const qs = (p: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString()

export const api = {
  orgs: {
    list: (skip = 0, limit = 50) => req<Org[]>(`/orgs/?${qs({ skip, limit })}`),
    get: (id: string) => req<Org>(`/orgs/${id}`),
    create: (data: OrgCreate) => req<Org>("/orgs/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: OrgUpdate) => req<Org>(`/orgs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/orgs/${id}`, { method: "DELETE" }),
  },
  products: {
    list: (orgId: string, skip = 0, limit = 50) =>
      req<Product[]>(`/products/?${qs({ org_id: orgId, skip, limit })}`),
    get: (id: string) => req<Product>(`/products/${id}`),
    create: (data: ProductCreate) => req<Product>("/products/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: ProductUpdate) => req<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/products/${id}`, { method: "DELETE" }),
  },
  users: {
    list: (skip = 0, limit = 100, org_id?: string) =>
      req<User[]>(`/users/?${qs({ skip, limit, org_id })}`),
    get: (id: string) => req<User>(`/users/${id}`),
    create: (data: UserCreate) => req<User>("/users/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: UserUpdate) => req<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/users/${id}`, { method: "DELETE" }),
  },
  orders: {
    list: (orgId: string, skip = 0, limit = 50) =>
      req<Order[]>(`/orders/?${qs({ org_id: orgId, skip, limit })}`),
    get: (id: string) => req<Order>(`/orders/${id}`),
    updateStatus: (id: string, status: string) =>
      req<Order>(`/orders/${id}/status?new_status=${status}`, { method: "PATCH" }),
  },
  invites: {
    create: (data: OrgInviteCreate) =>
      req<OrgInvite>("/invites/", { method: "POST", body: JSON.stringify(data) }),
    list: (orgId: string) => req<OrgInvite[]>(`/invites/${orgId}`),
    redeem: (code: string) =>
      req<OrgInvite>("/invites/redeem", { method: "POST", body: JSON.stringify({ code }) }),
    delete: (id: string) => req<void>(`/invites/${id}`, { method: "DELETE" }),
  },
}
