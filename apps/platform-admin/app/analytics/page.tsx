"use client"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3, Building2, Users, ShoppingCart,
  TrendingUp, TrendingDown, IndianRupee, Package,
  Zap, Rocket, Crown, CheckCircle2, Clock, XCircle, ClipboardList,
} from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4
  return (
    <div className="flex-1 h-full flex items-end">
      <div className={`w-full rounded-t-sm ${color}`} style={{ height: `${pct}%` }} />
    </div>
  )
}

function StatTile({ icon: Icon, label, value, sub, trend, color = "text-primary", bg = "bg-primary/10" }: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; trend?: number; color?: string; bg?: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
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

export default function AnalyticsPage() {
  const { data: orgs = [], isLoading: orgsLoading } = useQuery({ queryKey: ["orgs-all"], queryFn: () => api.orgs.list(0, 200) })
  const { data: users = [], isLoading: usersLoading } = useQuery({ queryKey: ["users-all"], queryFn: () => api.users.list(0, 200) })
  const { data: orgRequests = [] } = useQuery({ queryKey: ["org-requests"], queryFn: () => api.orgRequests.list() })

  const isLoading = orgsLoading || usersLoading

  const stats = useMemo(() => {
    const activeOrgs = orgs.filter(o => o.status === "active").length
    const plans = { starter: 0, pro: 0, enterprise: 0 }
    orgs.forEach(o => { plans[o.plan as keyof typeof plans] = (plans[o.plan as keyof typeof plans] || 0) + 1 })

    const roleCount: Record<string, number> = {}
    users.forEach(u => { roleCount[u.role] = (roleCount[u.role] || 0) + 1 })

    const pendingRequests = orgRequests.filter(r => r.status === "pending").length
    const approvedRequests = orgRequests.filter(r => r.status === "approved").length
    const rejectedRequests = orgRequests.filter(r => r.status === "rejected").length
    const approvalRate = orgRequests.length > 0 ? Math.round((approvedRequests / orgRequests.length) * 100) : 0

    // Monthly org creation (last 6 months)
    const now = new Date()
    const months: { label: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString("en-IN", { month: "short" })
      const count = orgs.filter(o => {
        const c = new Date(o.created_at)
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
      }).length
      months.push({ label, count })
    }
    const maxMonthlyOrgs = Math.max(...months.map(m => m.count), 1)

    // Monthly user signups (last 6 months)
    const userMonths: { label: string; count: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString("en-IN", { month: "short" })
      const count = users.filter(u => {
        const c = new Date(u.created_at)
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
      }).length
      userMonths.push({ label, count })
    }
    const maxMonthlyUsers = Math.max(...userMonths.map(m => m.count), 1)

    const thisMonthUsers = userMonths[5].count
    const lastMonthUsers = userMonths[4].count
    const userGrowth = lastMonthUsers > 0 ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0

    return { activeOrgs, plans, roleCount, pendingRequests, approvedRequests, rejectedRequests, approvalRate, months, maxMonthlyOrgs, userMonths, maxMonthlyUsers, thisMonthUsers, userGrowth }
  }, [orgs, users, orgRequests])

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

  const planColors = { starter: "text-blue-400", pro: "text-violet-400", enterprise: "text-amber-400" }
  const planBgs = { starter: "bg-blue-500/10", pro: "bg-violet-500/10", enterprise: "bg-amber-500/10" }
  const planIcons = { starter: Zap, pro: Rocket, enterprise: Crown }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> Platform Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Live data across all organisations</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Building2} label="Total Orgs" value={orgs.length}
          sub={`${stats.activeOrgs} active`} trend={12} color="text-primary" bg="bg-primary/10" />
        <StatTile icon={Users} label="Total Users" value={users.length}
          sub={`${stats.roleCount.end_user ?? 0} customers`} trend={8} color="text-blue-400" bg="bg-blue-500/10" />
        <StatTile icon={CheckCircle2} label="Approved Orgs" value={stats.approvedRequests}
          sub="via org requests" color="text-green-400" bg="bg-green-500/10" />
        <StatTile icon={Clock} label="Pending Requests" value={stats.pendingRequests}
          sub="awaiting review" color={stats.pendingRequests > 0 ? "text-orange-400" : "text-muted-foreground"}
          bg={stats.pendingRequests > 0 ? "bg-orange-500/10" : "bg-muted"} />
      </div>

      {/* Org growth chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Org Registrations — Last 6 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {stats.months.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                <span className="text-xs font-bold text-foreground">{m.count > 0 ? m.count : ""}</span>
                <div className="flex-1 w-full flex items-end">
                  <MiniBar value={m.count} max={stats.maxMonthlyOrgs}
                    color={i === stats.months.length - 1 ? "bg-primary" : "bg-primary/40"} />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User growth chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" /> User Signups — Last 6 Months
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{stats.thisMonthUsers}</span>
              {stats.userGrowth !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${stats.userGrowth >= 0 ? "text-green-400" : "text-destructive"}`}>
                  {stats.userGrowth >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(stats.userGrowth)}%
                </span>
              )}
              <span className="text-xs text-muted-foreground">this month</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-28">
            {stats.userMonths.map((m, i) => {
              const pct = stats.maxMonthlyUsers > 0 ? Math.max(4, (m.count / stats.maxMonthlyUsers) * 100) : 4
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                  <span className="text-xs font-bold text-foreground">{m.count > 0 ? m.count : ""}</span>
                  <div className="flex-1 w-full flex items-end">
                    <div className={`w-full rounded-t-sm ${i === stats.userMonths.length - 1 ? "bg-blue-400" : "bg-blue-400/35"}`}
                      style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Request funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Org Request Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {([
              { label: "Total",    value: orgRequests.length,          color: "text-foreground",    bg: "bg-muted",             border: "border-border" },
              { label: "Pending",  value: stats.pendingRequests,       color: "text-orange-400",    bg: "bg-orange-500/10",     border: "border-orange-500/20" },
              { label: "Approved", value: stats.approvedRequests,      color: "text-green-400",     bg: "bg-green-500/10",      border: "border-green-500/20" },
              { label: "Rejected", value: stats.rejectedRequests,      color: "text-destructive",   bg: "bg-destructive/10",    border: "border-destructive/20" },
            ]).map(({ label, value, color, bg, border }) => (
              <div key={label} className={`rounded-xl p-4 text-center border ${border} ${bg}`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {orgRequests.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Approval rate</span>
                <span className="font-semibold text-green-400">{stats.approvalRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden flex gap-0.5">
                <div className="h-full bg-green-400/70 transition-all" style={{ width: `${stats.approvalRate}%` }} />
                <div className="h-full bg-destructive/50 transition-all"
                  style={{ width: `${orgRequests.length > 0 ? Math.round((stats.rejectedRequests / orgRequests.length) * 100) : 0}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["starter", "pro", "enterprise"] as const).map((plan) => {
              const Icon = planIcons[plan]
              const count = stats.plans[plan]
              const pct = orgs.length > 0 ? Math.round((count / orgs.length) * 100) : 0
              return (
                <div key={plan} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium capitalize">
                      <Icon className={`h-4 w-4 ${planColors[plan]}`} />{plan}
                    </span>
                    <span className="text-muted-foreground">{count} org{count !== 1 ? "s" : ""} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${planBgs[plan].replace("/10", "/60")}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* User role distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> User Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { key: "end_user", label: "Customers", color: "bg-emerald-500/50" },
              { key: "org_admin", label: "Org Admins", color: "bg-violet-500/50" },
              { key: "orgs_manager", label: "Orgs Managers", color: "bg-blue-500/50" },
              { key: "platform_admin", label: "Platform Admins", color: "bg-rose-500/50" },
            ]).map(({ key, label, color }) => {
              const count = stats.roleCount[key] ?? 0
              const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="text-muted-foreground">{count} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Org status breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Organisation Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {([
              { status: "active", label: "Active", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
              { status: "suspended", label: "Suspended", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
              { status: "maintenance", label: "Maintenance", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            ]).map(({ status, label, icon: Icon, color, bg }) => {
              const count = orgs.filter(o => o.status === status).length
              return (
                <div key={status} className={`rounded-xl p-4 text-center ${bg} border border-border`}>
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
