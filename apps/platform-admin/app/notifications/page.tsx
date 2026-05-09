"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Bell, BellOff, CheckCheck, Package, ShoppingCart,
  Store, Star, AlertTriangle, CheckCircle2, XCircle,
  Info, Clock,
} from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Notification as AppNotification } from "@/lib/types"

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  order_placed:           { icon: ShoppingCart,  color: "text-blue-400",    bg: "bg-blue-500/10" },
  order_confirmed:        { icon: CheckCircle2,  color: "text-green-400",   bg: "bg-green-500/10" },
  order_shipped:          { icon: Package,       color: "text-violet-400",  bg: "bg-violet-500/10" },
  order_delivered:        { icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/10" },
  order_cancelled:        { icon: XCircle,       color: "text-destructive", bg: "bg-destructive/10" },
  low_stock:              { icon: AlertTriangle, color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  org_request_approved:   { icon: CheckCircle2,  color: "text-green-400",   bg: "bg-green-500/10" },
  org_request_rejected:   { icon: XCircle,       color: "text-destructive", bg: "bg-destructive/10" },
  new_review:             { icon: Star,          color: "text-amber-400",   bg: "bg-amber-500/10" },
  payment_received:       { icon: Store,         color: "text-emerald-400", bg: "bg-emerald-500/10" },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function NotifCard({ notif }: { notif: AppNotification }) {
  const qc = useQueryClient()
  const meta = TYPE_META[notif.type] ?? { icon: Info, color: "text-muted-foreground", bg: "bg-muted" }
  const Icon = meta.icon

  const markRead = useMutation({
    mutationFn: () => api.notifications.markRead(notif.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border transition-all cursor-default ${
        notif.is_read
          ? "border-border bg-card/40"
          : "border-primary/20 bg-primary/5 shadow-sm"
      }`}
    >
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
        <Icon className={`h-4 w-4 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-snug ${notif.is_read ? "text-foreground/80" : "text-foreground"}`}>
            {notif.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <Clock className="h-3 w-3" />{timeAgo(notif.created_at)}
            </span>
            {!notif.is_read && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
        {!notif.is_read && (
          <button
            onClick={() => markRead.mutate()}
            className="mt-1.5 text-[10px] text-primary hover:underline"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(false, 100),
  })

  const markAll = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const unread = notifications.filter(n => !n.is_read)
  const today = notifications.filter(n => {
    const d = new Date(n.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const older = notifications.filter(n => {
    const d = new Date(n.created_at)
    const now = new Date()
    return d.toDateString() !== now.toDateString()
  })

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unread.length > 0 ? `${unread.length} unread` : "All caught up!"}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
            {markAll.isPending ? "Marking…" : "Mark all read"}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <BellOff className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="font-semibold">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                You'll see order updates, alerts, and more here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="space-y-6">
          {today.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Today</p>
              <div className="space-y-2">
                {today.map(n => <NotifCard key={n.id} notif={n} />)}
              </div>
            </section>
          )}
          {older.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Earlier</p>
              <div className="space-y-2">
                {older.map(n => <NotifCard key={n.id} notif={n} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
