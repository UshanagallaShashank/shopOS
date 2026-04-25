"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ShoppingBag, Package, Truck, CheckCircle2,
  XCircle, Store, ArrowRight, Clock, IndianRupee,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { OrderStatusBadge } from "@/components/badges"
import type { OrderStatus } from "@/lib/types"

const STEPS: { status: OrderStatus; label: string; sublabel: string; icon: React.ElementType }[] = [
  { status: "pending",   label: "Placed",     sublabel: "Order received",         icon: ShoppingBag },
  { status: "confirmed", label: "Confirmed",  sublabel: "Being prepared",          icon: Package },
  { status: "shipped",   label: "On the way", sublabel: "Out for delivery",        icon: Truck },
  { status: "delivered", label: "Delivered",  sublabel: "Enjoy your purchase!",    icon: CheckCircle2 },
]
const STATUS_IDX: Record<string, number> = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 }

function DeliveryTracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 mt-3 text-sm text-destructive font-medium">
        <XCircle className="h-4 w-4" /> Order Cancelled
      </div>
    )
  }
  const idx = STATUS_IDX[status] ?? 0
  return (
    <div className="mt-4">
      <div className="relative flex items-start justify-between">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
        <div className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-700"
          style={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }} />
        {STEPS.map((step, i) => {
          const done   = i <= idx
          const active = i === idx
          const Icon   = step.icon
          return (
            <div key={step.status} className="relative flex flex-col items-center gap-2 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                done
                  ? active ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30"
                           : "bg-primary/15 border-primary/50 text-primary"
                  : "bg-card border-border text-muted-foreground/30"
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${done ? "text-foreground" : "text-muted-foreground/40"}`}>
                  {step.label}
                </p>
                {active && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[72px] leading-tight">{step.sublabel}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MyOrdersPage() {
  const { shopUser } = useAuth()

  const { data: myOrgs = [] } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => api.users.myOrgs(),
    enabled: !!shopUser,
  })

  const { data: myOrders = [], isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.orders.my(),
    enabled: !!shopUser,
  })

  const [filter, setFilter] = useState<"all" | "active" | "delivered">("all")

  const inProgress = myOrders.filter(o => ["pending","confirmed","shipped"].includes(o.status))
  const delivered  = myOrders.filter(o => o.status === "delivered")
  const totalSpent = myOrders.reduce((s, o) => s + Number(o.total), 0)

  const filtered = myOrders.filter(o => {
    if (filter === "active")    return ["pending","confirmed","shipped"].includes(o.status)
    if (filter === "delivered") return o.status === "delivered"
    return true
  })

  const orgName = (id: string) => myOrgs.find(o => o.id === id)?.name ?? null

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all your purchases across shops</p>
      </div>

      {/* Shop shortcuts */}
      {myOrgs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Your Shops</p>
          <div className="flex flex-wrap gap-2">
            {myOrgs.map(org => (
              <Link key={org.id} href={`/shop/${org.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/40 transition-all group text-sm">
                {org.logo ? (
                  <img src={org.logo} alt={org.name} className="h-5 w-5 rounded object-cover" />
                ) : (
                  <div className="h-5 w-5 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                    {org.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">{org.name}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
          <div className="flex justify-center mb-1.5">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold">{myOrders.length}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-center space-y-1">
          <div className="flex justify-center mb-1.5">
            <Clock className="h-4 w-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-400">{inProgress.length}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center space-y-1">
          <div className="flex justify-center mb-1.5">
            <IndianRupee className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">
            {totalSpent >= 1000 ? `${(totalSpent/1000).toFixed(1)}k` : totalSpent}
          </p>
          <p className="text-xs text-muted-foreground">Total Spent</p>
        </div>
      </div>

      {/* Filter tabs */}
      {myOrders.length > 0 && (
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border w-fit">
          {([["all", "All"], ["active", "Active"], ["delivered", "Delivered"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === val ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              }`}>
              {label}
              {val === "active" && inProgress.length > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-400 text-orange-900 text-[10px] font-bold">
                  {inProgress.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2].map(n => <div key={n} className="h-40 rounded-xl border border-border bg-card animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && myOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-dashed border-border">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-semibold">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Visit a shop to place your first order.
            </p>
            {myOrgs.length > 0 && (
              <Link href={`/shop/${myOrgs[0].id}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium mt-1">
                <Store className="h-3.5 w-3.5" /> Browse {myOrgs[0].name} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* No results for filter */}
      {!isLoading && myOrders.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No {filter} orders.</p>
      )}

      {/* Order cards */}
      {!isLoading && filtered.map((o) => {
        const shop    = orgName(o.org_id)
        const isLive  = ["pending","confirmed","shipped"].includes(o.status)
        return (
          <div key={o.id} className={`rounded-2xl border bg-card overflow-hidden transition-all ${
            isLive ? "border-primary/30 shadow-sm shadow-primary/5" : "border-border"
          }`}>
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0,8)}</span>
                  {shop && (
                    <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      <Store className="h-3 w-3" />{shop}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold">₹{Number(o.total).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <OrderStatusBadge status={o.status} />
            </div>
            <div className="px-5 pb-5">
              <DeliveryTracker status={o.status} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
