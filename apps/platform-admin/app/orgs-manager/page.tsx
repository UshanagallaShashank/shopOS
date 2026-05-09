"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Building2, Plus, AlertTriangle, CheckCircle2,
  Pause, Wrench, ArrowRight, Search, Zap, Rocket, Crown,
  Users, ClipboardList, TrendingUp, BarChart3, Activity,
} from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlanBadge, StatusBadge } from "@/components/badges"

function OrgAvatar({ name, logo }: { name: string; logo: string | null }) {
  if (logo) return <img src={logo} alt={name} className="h-8 w-8 rounded-lg object-cover border border-border shrink-0" />
  return (
    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
      {name[0]?.toUpperCase()}
    </div>
  )
}

const PLAN_META = {
  starter:    { icon: Zap,    color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  pro:        { icon: Rocket, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  enterprise: { icon: Crown,  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
}

export default function OrgsManagerDashboard() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["orgs"], queryFn: () => api.orgs.list(),
  })
  const { data: users = [] } = useQuery({
    queryKey: ["users-all"], queryFn: () => api.users.list(0, 200),
  })
  const { data: orgRequests = [] } = useQuery({
    queryKey: ["org-requests"], queryFn: () => api.orgRequests.list(),
  })

  const suspended  = orgs.filter((o) => o.status === "suspended")
  const maintenance = orgs.filter((o) => o.status === "maintenance")
  const active     = orgs.filter((o) => o.status === "active")
  const pendingReqs = orgRequests.filter(r => r.status === "pending").length
  const orgAdmins  = users.filter(u => u.role === "org_admin").length

  const filtered = orgs.filter((o) => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orgs Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all {orgs.length} organisations on the platform</p>
        </div>
        <Button asChild>
          <Link href="/orgs/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New Org</Link>
        </Button>
      </div>

      {/* Analytics summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Building2, label: "Total Orgs",    value: orgs.length,      sub: `${active.length} active`,  color: "text-primary",    bg: "bg-primary/10" },
          { icon: Users,     label: "Org Admins",    value: orgAdmins,        sub: "store owners",             color: "text-blue-400",   bg: "bg-blue-500/10" },
          { icon: ClipboardList, label: "Pending Requests", value: pendingReqs, sub: "awaiting review",       color: pendingReqs > 0 ? "text-orange-400" : "text-muted-foreground", bg: pendingReqs > 0 ? "bg-orange-500/10" : "bg-muted" },
          { icon: BarChart3,  label: "Plan Mix",     value: `${orgs.filter(o=>o.plan==="enterprise").length}E / ${orgs.filter(o=>o.plan==="pro").length}P / ${orgs.filter(o=>o.plan==="starter").length}S`, sub: "Ent · Pro · Starter", color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center mb-2.5`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xl font-bold leading-tight">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mt-0.5">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Growth chart (org registrations last 6 months) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Org Registrations — Last 6 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-20">
            {Array.from({ length: 6 }, (_, i) => {
              const now = new Date()
              const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
              const label = d.toLocaleString("en-IN", { month: "short" })
              const count = orgs.filter(o => {
                const c = new Date(o.created_at)
                return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
              }).length
              return { label, count }
            }).map(({ label, count }, i, arr) => {
              const max = Math.max(...arr.map(m => m.count), 1)
              const pct = Math.max(4, (count / max) * 100)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                  <span className="text-xs font-bold">{count > 0 ? count : ""}</span>
                  <div className="flex-1 w-full flex items-end">
                    <div className={`w-full rounded-t-sm ${i === 5 ? "bg-primary" : "bg-primary/35"}`} style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      {(suspended.length > 0 || maintenance.length > 0) && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">Orgs need attention</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {suspended.length > 0 && `${suspended.length} suspended`}
                {suspended.length > 0 && maintenance.length > 0 && " · "}
                {maintenance.length > 0 && `${maintenance.length} in maintenance mode`}
              </p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={() => setStatusFilter("suspended")}>
              Filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status + plan stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status cards */}
        <button onClick={() => setStatusFilter(statusFilter === "active" ? null : "active")}
          className={`text-left rounded-xl border p-4 transition-all ${statusFilter === "active" ? "border-green-500/50 bg-green-500/5" : "border-border bg-card hover:border-green-500/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</span>
          </div>
          <p className="text-3xl font-bold">{active.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">organisations</p>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === "suspended" ? null : "suspended")}
          className={`text-left rounded-xl border p-4 transition-all ${statusFilter === "suspended" ? "border-destructive/50 bg-destructive/5" : "border-border bg-card hover:border-destructive/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-destructive/10">
              <Pause className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suspended</span>
          </div>
          <p className="text-3xl font-bold">{suspended.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">organisations</p>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === "maintenance" ? null : "maintenance")}
          className={`text-left rounded-xl border p-4 transition-all ${statusFilter === "maintenance" ? "border-yellow-500/50 bg-yellow-500/5" : "border-border bg-card hover:border-yellow-500/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-yellow-500/10">
              <Wrench className="h-4 w-4 text-yellow-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Maintenance</span>
          </div>
          <p className="text-3xl font-bold">{maintenance.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">organisations</p>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["starter", "pro", "enterprise"] as const).map((plan) => {
          const m = PLAN_META[plan]
          const count = orgs.filter(o => o.plan === plan).length
          return (
            <Card key={plan} className={`border ${m.border}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${m.bg}`}>
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${m.color}`}>{plan}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Org table with search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base shrink-0">
              All Organisations
              {statusFilter && <span className="ml-2 text-xs font-normal text-muted-foreground">({statusFilter})</span>}
            </CardTitle>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search orgs…" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm" />
            </div>
            {statusFilter && (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)} className="text-xs shrink-0">
                Clear filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="text-muted-foreground text-sm p-6">Loading...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground text-sm p-6 text-center">No organisations match your search.</p>
          )}
          {filtered.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>{["Organisation", "Plan", "Status", ""].map((h, i) => (
                  <th key={i} className="text-left px-5 py-2.5 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-accent/40 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <OrgAvatar name={org.name} logo={org.logo} />
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">{org.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><PlanBadge plan={org.plan} /></td>
                    <td className="px-5 py-3"><StatusBadge status={org.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                          <Link href={`/orgs/${org.id}`} className="flex items-center gap-1">
                            View <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="h-7 px-2 text-xs">
                          <Link href={`/orgs/${org.id}/edit`}>Edit</Link>
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
    </div>
  )
}
