// API client — thin fetch wrapper, all routes in one place
import type {
  Org, OrgCreate, OrgUpdate, OrgUIUpdate,
  Product, ProductCreate, ProductUpdate,
  User, UserCreate, UserUpdate, Order, OrderCreate, OrderUpdate,
  OrgInvite, OrgInviteCreate,
  OrgRequest, OrgRequestCreate,
  ProductReview, ReviewCreate, ReviewUpdate,
} from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return (
    localStorage.getItem("shopos_token") ??
    document.cookie.match(/shopos_token=([^;]+)/)?.[1] ??
    null
  )
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

const qs = (p: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString()

export const api = {
  auth: {
    logout: () => req<{ message: string }>("/auth/logout", { method: "POST" }),
  },
  orgs: {
    list: (skip = 0, limit = 50) => req<Org[]>(`/orgs/?${qs({ skip, limit })}`),
    get: (id: string) => req<Org>(`/orgs/${id}`),
    create: (data: OrgCreate) => req<Org>("/orgs/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: OrgUpdate) => req<Org>(`/orgs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    updateUI: (id: string, data: OrgUIUpdate) => req<Org>(`/orgs/${id}/ui`, { method: "PATCH", body: JSON.stringify(data) }),
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
    list: (skip = 0, limit = 200, org_id?: string) =>
      req<User[]>(`/users/?${qs({ skip, limit, org_id })}`),
    get: (id: string) => req<User>(`/users/${id}`),
    create: (data: UserCreate) => req<User>("/users/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: UserUpdate) => req<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/users/${id}`, { method: "DELETE" }),
    setOrgAccess: (id: string, org_ids: string[]) =>
      req<User>(`/users/${id}/orgs`, { method: "PUT", body: JSON.stringify({ org_ids }) }),
    myOrgs: () => req<Org[]>("/users/me/orgs"),
  },
  orders: {
    list: (orgId: string, skip = 0, limit = 100) =>
      req<Order[]>(`/orders/?${qs({ org_id: orgId, skip, limit })}`),
    my: () => req<Order[]>("/orders/my"),
    get: (id: string) => req<Order>(`/orders/${id}`),
    create: (data: OrderCreate) =>
      req<Order>("/orders/", { method: "POST", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      req<Order>(`/orders/${id}/status?new_status=${status}`, { method: "PATCH" }),
    update: (id: string, data: OrderUpdate) =>
      req<Order>(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  invites: {
    create: (data: OrgInviteCreate) =>
      req<OrgInvite>("/invites/", { method: "POST", body: JSON.stringify(data) }),
    list: (orgId: string) => req<OrgInvite[]>(`/invites/${orgId}`),
    redeem: (code: string) =>
      req<OrgInvite>("/invites/redeem", { method: "POST", body: JSON.stringify({ code }) }),
    delete: (id: string) => req<void>(`/invites/${id}`, { method: "DELETE" }),
  },
  reviews: {
    list: (productId: string) => req<ProductReview[]>(`/products/${productId}/reviews`),
    create: (productId: string, data: ReviewCreate) =>
      req<ProductReview>(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify(data) }),
    update: (reviewId: string, data: ReviewUpdate) =>
      req<ProductReview>(`/reviews/${reviewId}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (reviewId: string) => req<void>(`/reviews/${reviewId}`, { method: "DELETE" }),
  },
  orgRequests: {
    create: (data: OrgRequestCreate) =>
      req<OrgRequest>("/org-requests/", { method: "POST", body: JSON.stringify(data) }),
    list: (status?: string) =>
      req<OrgRequest[]>(`/org-requests/?${status ? `status_filter=${status}` : ""}`),
    my: () => req<OrgRequest[]>("/org-requests/my"),
    review: (id: string, status: "approved" | "rejected") =>
      req<OrgRequest>(`/org-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },
}
