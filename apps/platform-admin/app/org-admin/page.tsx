"use client"
// Org Admin Dashboard — auto-loads the org assigned to this admin
// Full product CRUD + recent orders overview
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Package, ShoppingCart, Plus, Pencil, Trash2, Star, ImageOff, Eye } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "@/components/badges"
import { ConfirmDialog } from "@/components/confirm-dialog"

export default function OrgAdminDashboard() {
  const { shopUser, loading } = useAuth()
  const qc = useQueryClient()

  const orgId = shopUser?.org_id ?? ""

  const [confirmProductId, setConfirmProductId] = useState<string | null>(null)
  const [confirmProductName, setConfirmProductName] = useState("")

  const { data: org } = useQuery({
    queryKey: ["orgs", orgId],
    queryFn: () => api.orgs.get(orgId),
    enabled: !!orgId,
  })

  const { data: products = [] } = useQuery({
    queryKey: ["products", orgId],
    queryFn: () => api.products.list(orgId),
    enabled: !!orgId,
  })

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", orgId],
    queryFn: () => api.orders.list(orgId),
    enabled: !!orgId,
  })

  const deleteProduct = useMutation({
    mutationFn: (pid: string) => api.products.delete(pid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", orgId] })
      setConfirmProductId(null)
    },
  })

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>

  if (!orgId) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Org Admin</h1>
        <p className="text-muted-foreground text-sm">
          Your account is not assigned to an org yet. Contact a platform admin.
        </p>
      </div>
    )
  }

  const lowStock = products.filter((p) => p.stock < 5 && p.is_active)
  const pendingOrders = orders.filter((o) => o.status === "pending").length

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{org?.name ?? "Org Admin"}</h1>
          <p className="text-muted-foreground text-sm mt-1">{org?.slug}.shopOS.in</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/shop/${orgId}`} target="_blank">
            <Eye className="h-3.5 w-3.5 mr-1.5" />Preview Shop
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Products" value={products.length} />
        <StatCard icon={ShoppingCart} label="Orders" value={orders.length} />
        <StatCard icon={Package} label="Low Stock" value={lowStock.length} color="yellow" />
        <StatCard icon={ShoppingCart} label="Pending" value={pendingOrders} color="orange" />
      </div>

      {/* Products — full CRUD */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Products ({products.length})</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/orgs/${orgId}/products/new`}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Product
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm p-5">No products yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["", "Name", "Price", "Stock", "Rating", "Active", ""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/50 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded object-cover border border-border" />
                      ) : (
                        <div className="h-10 w-10 rounded border border-border bg-accent/30 flex items-center justify-center">
                          <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td className={`px-4 py-3 ${p.stock < 5 ? "text-yellow-400 font-medium" : ""}`}>{p.stock}</td>
                    <td className="px-4 py-3">
                      {p.avg_rating != null ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {p.avg_rating.toFixed(1)}
                          <span className="text-muted-foreground text-xs">({p.review_count})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.is_active ? "text-green-400" : "text-muted-foreground"}>
                        {p.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/orgs/${orgId}/products/${p.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setConfirmProductId(p.id)
                            setConfirmProductName(p.name)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm p-5">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Order", "Total", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="hover:bg-accent/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2.5 font-medium">₹{Number(o.total).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Delete product confirmation */}
      {confirmProductId && (
        <ConfirmDialog
          open={!!confirmProductId}
          onClose={() => setConfirmProductId(null)}
          onConfirm={() => deleteProduct.mutate(confirmProductId)}
          title="Delete Product"
          description={`Are you sure you want to delete "${confirmProductName}"? This cannot be undone.`}
          confirmText="Delete"
          variant="destructive"
          loading={deleteProduct.isPending}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color?: "yellow" | "orange"
}) {
  const c = color === "yellow" ? "text-yellow-400" : color === "orange" ? "text-orange-400" : "text-foreground"
  return (
    <Card><CardContent className="p-5 flex items-center gap-4">
      <Icon className={`h-8 w-8 ${c}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${c}`}>{value}</p>
      </div>
    </CardContent></Card>
  )
}
