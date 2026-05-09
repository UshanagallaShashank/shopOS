"use client"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Building2, Users, TrendingUp, AlertTriangle, CheckCircle2,
  Plus, ArrowRight, Crown, Zap, Rocket, ShieldCheck, ClipboardList,
  Activity, UserCheck, Clock, XCircle,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge, PlanBadge } from "@/components/badges"

const PLAN_META = {
  starter:    { icon: Zap,    color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  pro:        { icon: Rocket, color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
  enterprise: { icon: Crown,  color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; accent?: string
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 ${accent ?? "bg-primary/10"}`}>
          <Icon className={`h-5 w-5 ${accent ? "text-foreground" : "text-primary"}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function OrgAvatar({ name, logo }: { name: string; logo: string | null }) {
  if (logo) return <img src={logo} alt={name} className="h-8 w-8 rounded-lg object-cover border border-border" />
  return (
    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
      {name[0]?.toUpperCase()}
    </div>
  )
}

export default function DashboardPage() {
  const { shopUser, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (!shopUser || shopUser.role !== "platform_admin") router.replace("/")
  }, [shopUser, authLoading, router])

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["orgs"], queryFn: () => api.orgs.list(),
    enabled: shopUser?.role === "platform_admin",
  })
  const { data: users = [] } = useQuery({
    queryKey: ["users"], queryFn: () => api.users.list(),
    enabled: shopUser?.role === "platform_admin",
  })
  const { data: orgRequests = [] } = useQuery({
    queryKey: ["org-requests"], queryFn: () => api.orgRequests.list(),
    enabled: shopUser?.role === "platform_admin",
  })

  if (authLoading || !shopUser || shopUser.role !== "platform_admin") {
    return <div className="text-muted-foreground text-sm">Loading...</div>
  }

  const active    = orgs.filter((o) => o.status === "active").length
  const suspended = orgs.filter((o) => o.status === "suspended").length
  const maintenance = orgs.filter((o) => o.status === "maintenance").length
  const orgAdmins = users.filter((u) => u.role === "org_admin").length
  const endUsers  = users.filter((u) => u.role === "end_user").length
  const pendingRequests = orgRequests.filter(r => r.status === "pending").length

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Platform Dashboard
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Activity className="h-3 w-3" /> Live
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Full platform overview across all organisations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/org-requests"><ClipboardList className="h-3.5 w-3.5 mr-1.5" />Org Requests</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/orgs/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New Org</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({length: 4}).map((_, i) => (
            <Card key={i}><CardContent className="p-5 h-20 animate-pulse bg-muted" /></Card>
          ))}
        </div>
      ) : (
        <>
          {/* Alerts */}
          {(suspended > 0 || maintenance > 0) && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-400">Action needed</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {suspended > 0 && `${suspended} org${suspended>1?"s":""} suspended`}
                    {suspended > 0 && maintenance > 0 && " · "}
                    {maintenance > 0 && `${maintenance} in maintenance`}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto shrink-0" asChild>
                  <Link href="/orgs">Review</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Building2}  label="Total Orgs"  value={orgs.length} sub={`${active} active`} />
            <StatCard icon={CheckCircle2} label="Active Orgs" value={active} sub="running smoothly" accent="bg-green-500/10" />
            <StatCard icon={Users}      label="Org Admins"  value={orgAdmins} sub={`${endUsers} customers`} />
            <StatCard icon={ShieldCheck} label="Platform Team" value={users.filter(u => u.role === "platform_admin" || u.role === "orgs_manager").length} />
          </div>

          {/* Plan breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {(["starter", "pro", "enterprise"] as const).map((plan) => {
              const m = PLAN_META[plan]
              const count = orgs.filter((o) => o.plan === plan).length
              const pct = orgs.length ? Math.round((count / orgs.length) * 100) : 0
              return (
                <Card key={plan} className={`border ${m.border}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${m.bg}`}>
                        <m.icon className={`h-4 w-4 ${m.color}`} />
                      </div>
                      <span className={`text-xs font-semibold ${m.color} capitalize`}>{plan}</span>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">organisations</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${m.bg.replace("/10", "/60")}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{pct}% of total</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* User breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> User Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { role: "Platform Admin", count: users.filter(u=>u.role==="platform_admin").length, color: "bg-rose-400" },
                  { role: "Orgs Manager",   count: users.filter(u=>u.role==="orgs_manager").length,   color: "bg-blue-400" },
                  { role: "Org Admin",      count: orgAdmins, color: "bg-violet-400" },
                  { role: "Customer",       count: endUsers,  color: "bg-emerald-400" },
                ].map(({ role, count, color }) => (
                  <div key={role} className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
                    <span className="text-sm text-muted-foreground flex-1">{role}</span>
                    <span className="text-sm font-semibold tabular-nums">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { href: "/orgs/new",            label: "Create new org",        icon: Plus },
                  { href: "/users",               label: "Manage users",          icon: Users },
                  { href: "/admin/org-requests",  label: "Review org requests",   icon: ClipboardList },
                  { href: "/admin",               label: "Manage administrators", icon: ShieldCheck },
                ].map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-accent/60 transition-colors group">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="flex-1 text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent orgs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Recent Organisations</CardTitle>
                <Link href="/orgs" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>{["Organisation", "Plan", "Status", "Created"].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orgs.slice(0, 6).map((org) => (
                    <tr key={org.id} className="hover:bg-accent/40 transition-colors cursor-pointer group"
                      onClick={() => window.location.href = `/orgs/${org.id}`}>
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
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {new Date(org.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          {/* Recent signups + pending requests row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent users */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-400" /> Recent Signups
                  </CardTitle>
                  <Link href="/users" className="text-xs text-primary hover:underline flex items-center gap-1">
                    All users <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center gap-3 py-1">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {u.email?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.email ?? "—"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{u.role.replace(/_/g, " ")}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
                {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>}
              </CardContent>
            </Card>

            {/* Pending requests */}
            <Card className={pendingRequests > 0 ? "border-orange-500/20" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-orange-400" /> Org Requests
                    {pendingRequests > 0 && (
                      <span className="h-5 min-w-[20px] px-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {pendingRequests}
                      </span>
                    )}
                  </CardTitle>
                  <Link href="/admin/org-requests" className="text-xs text-primary hover:underline flex items-center gap-1">
                    Review <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {orgRequests.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center gap-3 py-1">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${
                      r.status === "approved" ? "bg-green-400" :
                      r.status === "rejected" ? "bg-destructive" : "bg-orange-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.org_name}</p>
                      <p className="text-xs text-muted-foreground">{r.user_email ?? "unknown"}</p>
                    </div>
                    <span className={`text-[10px] font-semibold capitalize ${
                      r.status === "approved" ? "text-green-400" :
                      r.status === "rejected" ? "text-destructive" : "text-orange-400"
                    }`}>{r.status}</span>
                  </div>
                ))}
                {orgRequests.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No requests yet</p>}
              </CardContent>
            </Card>
          </div>

          {/* Platform health summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Active Orgs",    value: active,       max: orgs.length,    color: "bg-green-400/70",   icon: CheckCircle2, iconColor: "text-green-400" },
                  { label: "Suspended",      value: suspended,    max: orgs.length,    color: "bg-destructive/60", icon: XCircle,      iconColor: "text-destructive" },
                  { label: "Maintenance",    value: maintenance,  max: orgs.length,    color: "bg-yellow-400/60",  icon: Clock,        iconColor: "text-yellow-400" },
                  { label: "Pending Reqs",   value: pendingRequests, max: Math.max(orgRequests.length, 1), color: "bg-orange-400/60", icon: ClipboardList, iconColor: "text-orange-400" },
                ].map(({ label, value, max, color, icon: Icon, iconColor }) => {
                  const pct = max > 0 ? Math.round((value / max) * 100) : 0
                  return (
                    <div key={label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />{label}
                        </span>
                        <span className="font-bold">{value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
