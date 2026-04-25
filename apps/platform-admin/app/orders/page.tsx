"use client"
// Orders management — platform_admin/orgs_manager pick an org; org_admin auto-loads their own
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ShoppingCart, Clock, Package, Truck, CheckCircle2, XCircle,
  ChevronRight, User, Calendar
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { OrderStatusBadge } from "@/components/badges"
import type { OrderStatus } from "@/lib/types"

// ── Status pipeline ────────────────────────────────────────────────────────

const PIPELINE: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "pending",   label: "Pending",   icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: Package },
  { status: "shipped",   label: "Shipped",   icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle2 },
]

const STATUS_IDX: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, delivered: 3, cancelled: -1,
}

function StatusStepper({
  current, orderId, onUpdate, disabled,
}: {
  current: string; orderId: string; onUpdate: (id: string, s: string) => void; disabled: boolean
}) {
  const idx = STATUS_IDX[current] ?? 0
  const cancelled = current === "cancelled"

  return (
    <div className="flex items-center gap-1">
      {cancelled ? (
        <span className="flex items-center gap-1 text-xs text-destructive font-medium">
          <XCircle className="h-3.5 w-3.5" /> Cancelled
        </span>
      ) : (
        PIPELINE.map((step, i) => {
          const done = i <= idx
          const next = i === idx + 1
          const Icon = step.icon
          return (
            <div key={step.status} className="flex items-center gap-1">
              <button
                title={next ? `Mark as ${step.label}` : step.label}
                disabled={disabled || i > idx + 1 || i <= idx}
                onClick={() => next && onUpdate(orderId, step.status)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  done
                    ? "bg-primary/10 text-primary"
                    : next
                    ? "border border-dashed border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
                    : "text-muted-foreground/40"
                } disabled:cursor-default`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < PIPELINE.length - 1 && (
                <ChevronRight className={`h-3 w-3 shrink-0 ${i < idx ? "text-primary/40" : "text-muted-foreground/20"}`} />
              )}
            </div>
          )
        })
      )}
      {!cancelled && idx < 3 && (
        <button
          disabled={disabled}
          onClick={() => onUpdate(orderId, "cancelled")}
          className="ml-2 text-xs text-destructive/60 hover:text-destructive transition-colors"
          title="Cancel order"
        >
          <XCircle className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const qc = useQueryClient()
  const { shopUser } = useAuth()

  const isOrgAdmin = shopUser?.role === "org_admin"
  const canPickOrg = shopUser?.role === "platform_admin" || shopUser?.role === "orgs_manager"

  // org_admin: use their own org directly; others: pick from selector
  const [pickedOrgId, setPickedOrgId] = useState("")
  const orgId = isOrgAdmin ? (shopUser?.org_id ?? "") : pickedOrgId

  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.orgs.list(),
    enabled: canPickOrg,
  })

  const { data: orgDetail } = useQuery({
    queryKey: ["orgs", orgId],
    queryFn: () => api.orgs.get(orgId),
    enabled: isOrgAdmin && !!orgId,
  })

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", orgId],
    queryFn: () => api.orders.list(orgId),
    enabled: !!orgId,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.orders.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", orgId] }),
  })

  const pending   = orders.filter((o) => o.status === "pending").length
  const active    = orders.filter((o) => o.status === "confirmed" || o.status === "shipped").length
  const delivered = orders.filter((o) => o.status === "delivered").length

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">
              {isOrgAdmin ? (orgDetail?.name ?? "Orders") : "Orders"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isOrgAdmin ? "Manage your store's orders" : "Select an org to view its orders"}
            </p>
          </div>
        </div>
        {canPickOrg && (
          <select
            value={pickedOrgId}
            onChange={(e) => setPickedOrgId(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-48"
          >
            <option value="">Select org…</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>

      {!orgId && canPickOrg && (
        <p className="text-muted-foreground text-sm">Choose an org above to see its orders.</p>
      )}

      {orgId && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-400">{pending}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">In Transit</p>
              <p className="text-2xl font-bold text-blue-400">{active}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Delivered</p>
              <p className="text-2xl font-bold text-green-400">{delivered}</p>
            </div>
          </div>

          {/* Orders */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {isLoading && (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((n) => <div key={n} className="h-14 rounded-lg bg-accent/30 animate-pulse" />)}
              </div>
            )}
            {!isLoading && orders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No orders yet.</p>
              </div>
            )}
            {orders.length > 0 && (
              <div className="divide-y divide-border">
                {orders.map((o) => (
                  <div key={o.id} className="px-5 py-4 space-y-3">
                    {/* Row top: ID + total + date */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground w-24 shrink-0">
                        #{o.id.slice(0, 8)}
                      </span>
                      <span className="font-bold">₹{Number(o.total).toLocaleString("en-IN")}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {o.user_id.slice(0, 8)}
                      </span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    {/* Status stepper */}
                    <StatusStepper
                      current={o.status}
                      orderId={o.id}
                      onUpdate={(id, s) => updateStatus.mutate({ id, status: s })}
                      disabled={updateStatus.isPending}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
