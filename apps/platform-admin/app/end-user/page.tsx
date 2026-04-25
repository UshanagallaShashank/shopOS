"use client"
// End User — My Orders with delivery progress tracker
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ShoppingBag, Clock, Package, Truck, CheckCircle2,
  XCircle, ChevronRight, Store
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { OrderStatusBadge } from "@/components/badges"
import type { OrderStatus } from "@/lib/types"

// ── Delivery progress tracker ──────────────────────────────────────────────

const STEPS: { status: OrderStatus; label: string; sublabel: string; icon: React.ElementType }[] = [
  { status: "pending",   label: "Order Placed",  sublabel: "We received your order",     icon: ShoppingBag },
  { status: "confirmed", label: "Confirmed",     sublabel: "Being prepared for dispatch", icon: Package },
  { status: "shipped",   label: "On the way",    sublabel: "Your order is out for delivery", icon: Truck },
  { status: "delivered", label: "Delivered",     sublabel: "Enjoy your purchase!",        icon: CheckCircle2 },
]

const STATUS_IDX: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, delivered: 3,
}

function DeliveryTracker({ status }: { status: string }) {
  const cancelled = status === "cancelled"
  const idx = STATUS_IDX[status] ?? 0

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm font-medium mt-3">
        <XCircle className="h-4 w-4" /> Order Cancelled
      </div>
    )
  }

  return (
    <div className="mt-4">
      {/* Progress line */}
      <div className="relative flex items-start justify-between gap-0">
        {/* Background line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
        {/* Filled line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, i) => {
          const done = i <= idx
          const active = i === idx
          const Icon = step.icon
          return (
            <div key={step.status} className="relative flex flex-col items-center gap-2 flex-1">
              {/* Circle */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                done
                  ? active
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-primary/20 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground/40"
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {/* Label */}
              <div className="text-center">
                <p className={`text-xs font-medium ${done ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[80px]">{step.sublabel}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
  const { shopUser } = useAuth()
  const isAdmin = shopUser?.role === "platform_admin" || shopUser?.role === "orgs_manager"

  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.orgs.list(),
    enabled: isAdmin,
  })

  const { data: myOrgs = [] } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => api.users.myOrgs(),
    enabled: !isAdmin && !!shopUser,
  })

  const [pickedOrgId, setPickedOrgId] = useState("")

  const { data: adminOrders = [], isLoading: adminLoading } = useQuery({
    queryKey: ["orders", pickedOrgId],
    queryFn: () => api.orders.list(pickedOrgId),
    enabled: isAdmin && !!pickedOrgId,
  })

  const { data: myOrders = [], isLoading: myLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.orders.my(),
    enabled: !isAdmin && !!shopUser,
  })

  const orders = isAdmin ? adminOrders : myOrders
  const isLoading = isAdmin ? adminLoading : myLoading

  const inProgress = orders.filter((o) => ["pending", "confirmed", "shipped"].includes(o.status)).length
  const delivered  = orders.filter((o) => o.status === "delivered").length

  const orgName = (id: string) => myOrgs.find((o) => o.id === id)?.name ?? null

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your purchases</p>
        </div>
        {isAdmin && (
          <select
            value={pickedOrgId}
            onChange={(e) => setPickedOrgId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-44"
          >
            <option value="">Select shop…</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {isAdmin && !pickedOrgId && (
        <p className="text-muted-foreground text-sm">Select a shop above to view its orders.</p>
      )}

      {(!isAdmin || pickedOrgId) && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-orange-400">{inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
              <p className="text-2xl font-bold text-green-400">{delivered}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
          </div>

          {/* Skeletons */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-36 rounded-xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border border-dashed border-border">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
              <div className="text-center space-y-1">
                <p className="font-medium">No orders yet</p>
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Head to{" "}
                    <Link href="/shop" className="text-primary underline">Shop</Link>
                    {" "}to place your first order.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Order cards */}
          {!isLoading && orders.map((o) => {
            const shop = !isAdmin ? orgName(o.org_id) : null
            const active = ["pending", "confirmed", "shipped"].includes(o.status)
            return (
              <div
                key={o.id}
                className={`rounded-xl border bg-card overflow-hidden ${
                  active ? "border-primary/30" : "border-border"
                }`}
              >
                {/* Card header */}
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                      {shop && (
                        <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                          <Store className="h-3 w-3" />{shop}
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-bold">₹{Number(o.total).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>

                {/* Delivery tracker */}
                <div className="px-5 pb-5">
                  <DeliveryTracker status={o.status} />
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
