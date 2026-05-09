"use client"
import { useMemo, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ShoppingBag, Package, Truck, CheckCircle2, XCircle,
  Store, ArrowRight, Clock, IndianRupee, Heart,
  TrendingUp, TrendingDown, BarChart3, Calendar,
  MapPin, Star, ShoppingCart,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { OrderStatusBadge } from "@/components/badges"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { OrderStatus } from "@/lib/types"

type Tab = "orders" | "spending" | "tracking" | "wishlist"

const STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "pending",   label: "Placed",    icon: ShoppingBag },
  { status: "confirmed", label: "Confirmed", icon: Package },
  { status: "shipped",   label: "On the way",icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle2 },
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
              <p className={`text-xs font-semibold ${done ? "text-foreground" : "text-muted-foreground/40"}`}>
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function fmt(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}k`
  return `₹${n.toLocaleString("en-IN")}`
}

export default function MyOrdersPage() {
  const { shopUser } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("orders")
  const [filter, setFilter] = useState<"all" | "active" | "delivered">("all")

  useEffect(() => {
    const t = (searchParams.get("tab") as Tab | null) ?? "orders"
    setTab(t)
  }, [searchParams])

  function handleTab(t: Tab) {
    router.push(t === "orders" ? "/end-user" : `/end-user?tab=${t}`)
  }

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

  const inProgress = myOrders.filter(o => ["pending","confirmed","shipped","out_for_delivery"].includes(o.status))
  const delivered  = myOrders.filter(o => o.status === "delivered")
  const totalSpent = delivered.reduce((s, o) => s + Number(o.total), 0)

  const spendingStats = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const label = d.toLocaleString("en-IN", { month: "short" })
      const spend = delivered
        .filter(o => {
          const c = new Date(o.created_at)
          return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
        })
        .reduce((s, o) => s + Number(o.total), 0)
      return { label, spend }
    })

    const thisMonth = months[5].spend
    const lastMonth = months[4].spend
    const trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0
    const maxSpend = Math.max(...months.map(m => m.spend), 1)

    const byShop: Record<string, { name: string; spend: number; count: number }> = {}
    myOrders.filter(o => o.status === "delivered").forEach(o => {
      const shop = myOrgs.find(s => s.id === o.org_id)
      const key = o.org_id
      if (!byShop[key]) byShop[key] = { name: shop?.name ?? "Unknown", spend: 0, count: 0 }
      byShop[key].spend += Number(o.total)
      byShop[key].count++
    })
    const topShops = Object.values(byShop).sort((a, b) => b.spend - a.spend)

    return { months, thisMonth, lastMonth, trend, maxSpend, topShops }
  }, [myOrders, myOrgs, delivered])

  const filtered = myOrders.filter(o => {
    if (filter === "active")    return ["pending","confirmed","shipped","out_for_delivery"].includes(o.status)
    if (filter === "delivered") return o.status === "delivered"
    return true
  })

  const orgName = (id: string) => myOrgs.find(o => o.id === id)?.name ?? null

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "orders",   label: "My Orders",   icon: Package,    badge: inProgress.length },
    { id: "tracking", label: "Tracking",    icon: Truck,      badge: inProgress.length },
    { id: "spending", label: "Spending",    icon: BarChart3 },
    { id: "wishlist", label: "Wishlist",    icon: Heart },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Shopping</h1>
        <p className="text-muted-foreground text-sm mt-1">Orders, tracking, and spending insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Package className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-2xl font-bold">{myOrders.length}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
          <Clock className="h-4 w-4 text-orange-400 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-orange-400">{inProgress.length}</p>
          <p className="text-xs text-muted-foreground">In Progress</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <IndianRupee className="h-4 w-4 text-emerald-400 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-emerald-400">{fmt(totalSpent)}</p>
          <p className="text-xs text-muted-foreground">Total Spent</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-border -mx-0 overflow-x-auto scrollbar-none">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => handleTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px relative ${
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="ml-0.5 h-4 min-w-[16px] px-1 inline-flex items-center justify-center rounded-full bg-orange-400 text-orange-900 text-[9px] font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── MY ORDERS TAB ── */}
      {tab === "orders" && (
        <div className="space-y-4">
          {/* Shop shortcuts */}
          {myOrgs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {myOrgs.map(org => (
                <Link key={org.id} href={`/shop/${org.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/40 transition-all text-sm group">
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="h-5 w-5 rounded object-cover" />
                  ) : (
                    <div className="h-5 w-5 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                      {org.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium group-hover:text-primary transition-colors">{org.name}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          )}

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

          {isLoading && (
            <div className="space-y-3">
              {[1,2].map(n => <div key={n} className="h-40 rounded-xl border border-border bg-card animate-pulse" />)}
            </div>
          )}

          {!isLoading && myOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-dashed border-border">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold">No orders yet</p>
                <p className="text-sm text-muted-foreground">Visit a shop to place your first order.</p>
                {myOrgs.length > 0 && (
                  <Link href={`/shop/${myOrgs[0].id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium mt-1">
                    <Store className="h-3.5 w-3.5" /> Browse {myOrgs[0].name} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {!isLoading && myOrders.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No {filter} orders.</p>
          )}

          {!isLoading && filtered.map((o) => {
            const shop = orgName(o.org_id)
            const isLive = ["pending","confirmed","shipped","out_for_delivery"].includes(o.status)
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
      )}

      {/* ── TRACKING TAB ── */}
      {tab === "tracking" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {inProgress.length === 0 ? "No active deliveries." : `${inProgress.length} order${inProgress.length > 1 ? "s" : ""} in transit`}
          </p>
          {inProgress.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 rounded-2xl border border-dashed border-border text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <Truck className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div>
                <p className="font-semibold">Nothing in transit</p>
                <p className="text-sm text-muted-foreground mt-1">Active orders will appear here with live tracking.</p>
              </div>
            </div>
          ) : (
            inProgress.map(o => {
              const shop = orgName(o.org_id)
              return (
                <div key={o.id} className="rounded-2xl border border-primary/30 bg-card overflow-hidden shadow-sm shadow-primary/5">
                  <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0,8)}</span>
                        {shop && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{shop}</span>
                        )}
                      </div>
                      <p className="text-xl font-bold mt-1">₹{Number(o.total).toLocaleString("en-IN")}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  {(o.courier_name || o.tracking_number) && (
                    <div className="px-5 py-3 bg-primary/5 border-b border-border flex items-center gap-4 text-xs">
                      {o.courier_name && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Truck className="h-3.5 w-3.5 text-primary" />{o.courier_name}
                        </span>
                      )}
                      {o.tracking_number && (
                        <span className="font-mono text-muted-foreground">#{o.tracking_number}</span>
                      )}
                      {o.shipping_city && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />{o.shipping_city}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="px-5 pb-5">
                    <DeliveryTracker status={o.status} />
                  </div>
                  {o.estimated_delivery && (
                    <div className="px-5 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Est. delivery: {new Date(o.estimated_delivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── SPENDING TAB ── */}
      {tab === "spending" && (
        <div className="space-y-5">
          {/* This month vs last */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">This Month</p>
              <p className="text-2xl font-bold mt-1">{fmt(spendingStats.thisMonth)}</p>
              {spendingStats.trend !== 0 && (
                <p className={`text-xs flex items-center gap-1 mt-1 font-medium ${
                  spendingStats.trend > 0 ? "text-red-400" : "text-green-400"
                }`}>
                  {spendingStats.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(spendingStats.trend)}% vs last month
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Last Month</p>
              <p className="text-2xl font-bold mt-1">{fmt(spendingStats.lastMonth)}</p>
              <p className="text-xs text-muted-foreground mt-1">{delivered.length} delivered orders total</p>
            </div>
          </div>

          {/* Monthly bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Spending — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalSpent === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No spending data yet</div>
              ) : (
                <div className="flex items-end gap-2 h-28">
                  {spendingStats.months.map((m, i) => {
                    const pct = spendingStats.maxSpend > 0 ? Math.max(4, (m.spend / spendingStats.maxSpend) * 100) : 4
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                        <span className="text-[10px] font-bold text-foreground leading-none">
                          {m.spend > 0 ? fmt(m.spend) : ""}
                        </span>
                        <div className="flex-1 w-full flex items-end">
                          <div className={`w-full rounded-t-sm transition-all ${i === 5 ? "bg-primary" : "bg-primary/35"}`}
                            style={{ height: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{m.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spending by shop */}
          {spendingStats.topShops.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" /> Spending by Shop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {spendingStats.topShops.map((shop, i) => {
                  const pct = spendingStats.topShops[0].spend > 0
                    ? Math.round((shop.spend / spendingStats.topShops[0].spend) * 100)
                    : 0
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate flex-1">{shop.name}</span>
                        <span className="text-muted-foreground ml-2 shrink-0">{fmt(shop.spend)} · {shop.count} order{shop.count > 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/50 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {totalSpent === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border">
              <IndianRupee className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
              <p className="text-sm font-semibold">No spending yet</p>
              <p className="text-xs text-muted-foreground mt-1">Delivered orders will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* ── WISHLIST TAB ── */}
      {tab === "wishlist" && (
        <div className="flex flex-col items-center gap-4 py-16 rounded-2xl border border-dashed border-border text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Heart className="h-8 w-8 text-primary/40" />
          </div>
          <div>
            <p className="font-semibold">Wishlist coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">Save products you love — browse and order anytime.</p>
          </div>
          <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">Coming soon</span>
        </div>
      )}
    </div>
  )
}
