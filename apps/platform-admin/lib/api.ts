// API client — thin fetch wrapper, all routes in one place
import type { Org, OrgCreate, OrgUpdate, Product, ProductCreate, ProductUpdate } from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

// Build query string, skipping undefined values
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
}
