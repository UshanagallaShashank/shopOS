"use client"
// Orders page — lists orders for a selected org, update status inline
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ShoppingCart } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "@/components/badges"
import type { OrderStatus } from "@/lib/types"

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"]

export default function OrdersPage() {
  const qc = useQueryClient()
  const { data: orgs = [] } = useQuery({ queryKey: ["orgs"], queryFn: () => api.orgs.list() })
  const [orgId, setOrgId] = useState("")

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", orgId],
    queryFn: () => api.orders.list(orgId),
    enabled: !!orgId,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.orders.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", orgId] }),
  })

  const selectClass = "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-muted-foreground text-sm">Select an org to view its orders</p>
          </div>
        </div>
        {/* Org selector */}
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className={selectClass + " w-48"}>
          <option value="">Select org...</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {!orgId && (
        <p className="text-muted-foreground text-sm">Choose an org above to see its orders.</p>
      )}

      {orgId && (
        <Card>
          <CardContent className="p-0">
            {isLoading && <p className="text-muted-foreground text-sm p-6">Loading...</p>}
            {!isLoading && orders.length === 0 && (
              <p className="text-muted-foreground text-sm p-6">No orders for this org yet.</p>
            )}
            {orders.length > 0 && (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {["Order ID", "Total", "Status", "Created", "Update Status"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}…</td>
                      <td className="px-5 py-3 font-medium">₹{Number(o.total).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                          className={selectClass}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
