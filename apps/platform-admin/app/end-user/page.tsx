"use client"
// End User Dashboard — user sees their own orders
// platform_admin gets an org selector to view any user's orders
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ShoppingBag } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrderStatusBadge } from "@/components/badges"

export default function EndUserDashboard() {
  const { shopUser } = useAuth()
  const isAdmin = shopUser?.role === "platform_admin" || shopUser?.role === "orgs_manager"

  // Admins can pick any org to inspect — regular users have no selector
  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.orgs.list(),
    enabled: isAdmin,
  })

  const [orgId, setOrgId] = useState("")

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", orgId],
    queryFn: () => api.orders.list(orgId),
    enabled: !!orgId,
  })

  const delivered = orders.filter((o) => o.status === "delivered").length
  const pending = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length

  const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your order history and status</p>
        </div>
        {/* Only admins see the org selector — end_users don't pick an org */}
        {isAdmin && (
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)}
            className={selectClass + " w-44"}>
            <option value="">Select shop...</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {/* End users see a prompt if no org selected — admins need to pick one */}
      {!orgId && (
        <p className="text-muted-foreground text-sm">
          {isAdmin ? "Select a shop above to view its orders." : "No orders yet."}
        </p>
      )}

      {orgId && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-5 text-center">
              <ShoppingBag className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
            </CardContent></Card>
            <Card><CardContent className="p-5 text-center">
              <p className="text-2xl font-bold text-orange-400">{pending}</p>
              <p className="text-xs text-muted-foreground mt-1">In Progress</p>
            </CardContent></Card>
            <Card><CardContent className="p-5 text-center">
              <p className="text-2xl font-bold text-green-400">{delivered}</p>
              <p className="text-xs text-muted-foreground mt-1">Delivered</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading && <p className="text-muted-foreground text-sm p-6">Loading...</p>}
              {!isLoading && orders.length === 0 && (
                <p className="text-muted-foreground text-sm p-6">No orders for this shop.</p>
              )}
              {orders.length > 0 && (
                <div className="divide-y divide-border">
                  {orders.map((o) => (
                    <div key={o.id} className="px-5 py-4 flex justify-between items-center hover:bg-accent/50">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                        <p className="font-semibold mt-0.5">₹{Number(o.total).toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(o.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
