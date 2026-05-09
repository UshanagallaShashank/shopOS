"use client"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  IndianRupee, TrendingUp, TrendingDown, ShoppingCart,
  Building2, CheckCircle2, Package, Crown, Rocket, Zap,
  BarChart3, ArrowUpRight,
} from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function StatCard({ icon: Icon, label, value, sub, trend, color = "text-primary", bg = "bg-primary/10" }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; trend?: number; color?: string; bg?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {trend !== undefined && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-green-400" : "text-destructive"}`}>
              {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mt-0.5">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function fmt(n: number) {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)   return `₹${(n / 1_000).toFixed(1)}k`
  return `₹${n.toLocaleString("en-IN")}`
}

export default function RevenuePage() {
  const { data: orgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["orgs-all"],
    queryFn: () => api.orgs.list(0, 200),
  })

  // Fetch orders for each active org — we cap at first 10 orgs to avoid too many requests
  const activeOrgs = orgs.filter(o => o.status === "active").slice(0, 10)

  const orderQueries = useQuery({
    queryKey: ["all-orders-revenue"],
    queryFn: async () => {
      const results = await Promise.allSettled(
        orgs.map(o => api.orders.list(o.id, 0, 200).then(orders => ({ orgId: o.id, orders })))
      )
      return results
        .filter((r): r is PromiseFulfilledResult<{ orgId: string; orders: Awaited<ReturnType<typeof api.orders.list>> }> => r.status === "fulfilled")
        .map(r => r.value)
    },
    enabled: orgs.length > 0,
    staleTime: 60_000,
  })

  const stats = useMemo(() => {
    if (!orderQueries.data) return null

    const allOrders = orderQueries.data.flatMap(d => d.orders)
    const delivered  = allOrders.filter(o => o.status === "delivered")
    const totalRev   = delivered.reduce((s, o) => s + Number(o.total), 0)
    const totalOrders = allOrders.length
    const avgOrderVal = delivered.length > 0 ? totalRev / delivered.length : 0

    // Revenue per org
    const orgRevenue = orderQueries.data.map(({ orgId, orders }) => {
      const rev = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0)
      const org = orgs.find(o => o.id === orgId)
      return { orgId, name: org?.name ?? orgId, rev, orderCount: orders.length }
    }).sort((a, b) => b.rev - a.rev)

    // Monthly revenue (last 6 months)
    const now = new Date()
    const months: { label: string; rev: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString("en-IN", { month: "short" })
      const rev = delivered.filter(o => {
        const c = new Date(o.created_at)
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
      }).reduce((s, o) => s + Number(o.total), 0)
      months.push({ label, rev })
    }
    const maxRev = Math.max(...months.map(m => m.rev), 1)

    // Plan revenue breakdown (estimate based on plan pricing)
    const planPrice = { starter: 999, pro: 2999, enterprise: 9999 }
    const planCount = { starter: 0, pro: 0, enterprise: 0 }
    orgs.forEach(o => { planCount[o.plan as keyof typeof planCount] = (planCount[o.plan as keyof typeof planCount] || 0) + 1 })
    const subRevenue = Object.entries(planCount).reduce((s, [plan, count]) => s + (planPrice[plan as keyof typeof planPrice] ?? 0) * count, 0)

    return { totalRev, totalOrders, avgOrderVal, orgRevenue, months, maxRev, subRevenue, deliveredCount: delivered.length }
  }, [orderQueries.data, orgs])

  const isLoading = orgsLoading || orderQueries.isLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(n => <div key={n} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <IndianRupee className="h-6 w-6 text-primary" /> Revenue
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">GMV and subscription revenue across all organisations</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Gross Merchandise Value" value={fmt(stats?.totalRev ?? 0)}
          sub={`${stats?.deliveredCount ?? 0} delivered orders`} trend={14} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.totalOrders ?? 0}
          sub="across all stores" trend={8} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={BarChart3} label="Avg Order Value" value={fmt(Math.round(stats?.avgOrderVal ?? 0))}
          sub="per delivered order" color="text-violet-400" bg="bg-violet-500/10" />
        <StatCard icon={Building2} label="Platform Subscriptions" value={fmt(stats?.subRevenue ?? 0)}
          sub={`${orgs.length} active orgs`} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      {/* Monthly GMV chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Monthly GMV — Last 6 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-36">
            {stats?.months.map((m, i) => {
              const pct = stats.maxRev > 0 ? Math.max(4, (m.rev / stats.maxRev) * 100) : 4
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                  <span className="text-xs font-bold text-foreground">{m.rev > 0 ? fmt(m.rev) : ""}</span>
                  <div className="flex-1 w-full flex items-end">
                    <div className="flex-1 h-full flex items-end">
                      <div
                        className={`w-full rounded-t-sm transition-all ${i === (stats.months.length - 1) ? "bg-primary" : "bg-primary/40"}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top orgs by revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" /> Top Stores by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.orgRevenue ?? []).slice(0, 6).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No revenue data yet</p>
            ) : (
              (stats?.orgRevenue ?? []).slice(0, 6).map((org, i) => {
                const maxOrgRev = stats?.orgRevenue[0]?.rev ?? 1
                const pct = maxOrgRev > 0 ? Math.round((org.rev / maxOrgRev) * 100) : 0
                return (
                  <div key={org.orgId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium min-w-0">
                        <span className={`text-xs font-bold w-4 shrink-0 ${i === 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                          #{i + 1}
                        </span>
                        <span className="truncate">{org.name}</span>
                      </span>
                      <span className="text-muted-foreground shrink-0 ml-2">{fmt(org.rev)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${i === 0 ? "bg-amber-400/70" : "bg-primary/40"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Subscription plan revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Subscription Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              { plan: "starter" as const, label: "Starter", icon: Zap, price: 999, color: "text-blue-400", bg: "bg-blue-500/40" },
              { plan: "pro" as const, label: "Pro", icon: Rocket, price: 2999, color: "text-violet-400", bg: "bg-violet-500/40" },
              { plan: "enterprise" as const, label: "Enterprise", icon: Crown, price: 9999, color: "text-amber-400", bg: "bg-amber-500/40" },
            ] as const).map(({ plan, label, icon: Icon, price, color, bg }) => {
              const count = orgs.filter(o => o.plan === plan).length
              const rev = count * price
              return (
                <div key={plan} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-sm font-bold">{fmt(rev)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{count} org{count !== 1 ? "s" : ""} × ₹{price.toLocaleString("en-IN")}/mo</p>
                  </div>
                </div>
              )
            })}
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Monthly Recurring Revenue</span>
              <span className="text-sm font-bold text-emerald-400">{fmt(stats?.subRevenue ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order status breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" /> Order Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { status: "pending",   label: "Pending",   color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
              { status: "confirmed", label: "Confirmed", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
              { status: "shipped",   label: "Shipped",   color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
              { status: "delivered", label: "Delivered", color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
            ]).map(({ status, label, color, bg, border }) => {
              const allOrders = (orderQueries.data ?? []).flatMap(d => d.orders)
              const count = allOrders.filter(o => o.status === status).length
              const rev   = allOrders.filter(o => o.status === status).reduce((s, o) => s + Number(o.total), 0)
              return (
                <div key={status} className={`rounded-xl p-4 border ${border} ${bg}`}>
                  <CheckCircle2 className={`h-5 w-5 mb-2 ${color}`} />
                  <p className={`text-xl font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  {rev > 0 && <p className={`text-xs font-semibold mt-1 ${color}`}>{fmt(rev)}</p>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
