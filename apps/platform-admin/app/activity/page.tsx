"use client"
import { useQuery } from "@tanstack/react-query"
import {
  Activity, Building2, Users, ShoppingCart,
  ClipboardList, Plus, Pencil, Trash2, CheckCircle2,
  XCircle, Clock, Search,
} from "lucide-react"
import { useState } from "react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function ActivityPage() {
  const [search, setSearch] = useState("")

  const { data: orgs = [] } = useQuery({ queryKey: ["orgs-all"], queryFn: () => api.orgs.list(0, 200) })
  const { data: users = [] } = useQuery({ queryKey: ["users-all"], queryFn: () => api.users.list(0, 200) })
  const { data: orgRequests = [] } = useQuery({ queryKey: ["org-requests"], queryFn: () => api.orgRequests.list() })

  // Build synthetic activity feed from real data
  const events = [
    ...orgs.map(o => ({
      id: `org-${o.id}`,
      type: "org_created",
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      title: `Organisation "${o.name}" created`,
      meta: o.slug,
      time: o.created_at,
    })),
    ...users.map(u => ({
      id: `user-${u.id}`,
      type: "user_registered",
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      title: `New user registered`,
      meta: u.email ?? u.role,
      time: u.created_at,
    })),
    ...orgRequests.map(r => ({
      id: `req-${r.id}`,
      type: r.status === "approved" ? "request_approved" : r.status === "rejected" ? "request_rejected" : "request_pending",
      icon: r.status === "approved" ? CheckCircle2 : r.status === "rejected" ? XCircle : ClipboardList,
      color: r.status === "approved" ? "text-green-400" : r.status === "rejected" ? "text-destructive" : "text-orange-400",
      bg: r.status === "approved" ? "bg-green-500/10" : r.status === "rejected" ? "bg-destructive/10" : "bg-orange-500/10",
      title: `Org request "${r.org_name}" ${r.status}`,
      meta: r.user_email ?? "unknown user",
      time: r.updated_at ?? r.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.meta?.toLowerCase().includes(search.toLowerCase()))

  const byDate = events.reduce((acc, e) => {
    const key = new Date(e.time).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {} as Record<string, typeof events>)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> Activity Log
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{events.length} events across the platform</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filter events…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {Object.entries(byDate).length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No activity found</p>
        </div>
      )}

      {Object.entries(byDate).map(([date, items]) => (
        <section key={date} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{date}</p>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {items.map((e) => {
                const Icon = e.icon
                return (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${e.bg}`}>
                      <Icon className={`h-4 w-4 ${e.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      {e.meta && <p className="text-xs text-muted-foreground truncate">{e.meta}</p>}
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />{timeAgo(e.time)}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  )
}
