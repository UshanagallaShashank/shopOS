"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Package, ShoppingCart, Plus, Pencil, Trash2, Star,
  ImageOff, Eye, LayoutTemplate, CheckCircle2, TrendingUp,
  AlertTriangle, Truck, MapPin,
  Palette, ArrowRight, BarChart3, Boxes, Tag,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OrderStatusBadge } from "@/components/badges"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TEMPLATES, PRIMARY_COLORS, getTemplate } from "@/lib/templates"
import { TemplateShell } from "@/components/template-shell"
import type { TemplateId } from "@/lib/templates"
import type { Order, OrderStatus } from "@/lib/types"

type Tab = "overview" | "products" | "orders" | "storefront"

const STATUS_FLOW: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled",
]
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", cancelled: "Cancelled",
}

// ── Tabs ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "products", label: "Products", icon: Boxes },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "storefront", label: "Storefront", icon: LayoutTemplate },
  ]
  return (
    <div className="flex gap-0.5 border-b border-border bg-card/40 -mx-6 px-6 overflow-x-auto scrollbar-none">
      {tabs.map((t) => {
        const Icon = t.icon
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-px ${
              active === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}>
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "primary" }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string
  color?: "primary" | "green" | "orange" | "yellow"
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-500/10 text-green-500",
    orange: "bg-orange-500/10 text-orange-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
  }
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-2.5 rounded-xl shrink-0 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
          <p className="text-2xl font-bold leading-tight mt-0.5 truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Order row with inline status update ────────────────────────────────────
function OrderRow({ order, orgId }: { order: Order; orgId: string }) {
  const qc = useQueryClient()

  const updateStatus = useMutation({
    mutationFn: (s: string) => api.orders.updateStatus(order.id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", orgId] }),
  })

  return (
    <tr className="group hover:bg-accent/40 transition-colors">
      <td className="px-4 py-3">
        <p className="font-mono text-xs font-medium text-foreground">#{order.id.slice(0, 8)}</p>
        {order.shipping_city && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />{order.shipping_city}
            {order.shipping_state && `, ${order.shipping_state}`}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="font-bold text-foreground">₹{Number(order.total).toLocaleString("en-IN")}</p>
        {order.items && order.items.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.items.map(i => i.product_name ?? "Item").slice(0, 2).join(", ")}
            {order.items.length > 2 && ` +${order.items.length - 2} more`}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <select
            value={order.status}
            disabled={updateStatus.isPending}
            onChange={(e) => updateStatus.mutate(e.target.value)}
            className="h-7 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 cursor-pointer"
          >
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {updateStatus.isPending && (
            <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm whitespace-nowrap">
        {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </td>
    </tr>
  )
}

// ── Template card ──────────────────────────────────────────────────────────
function TemplateCard({ template, selected, onSelect }: {
  template: typeof TEMPLATES[0]; selected: boolean; onSelect: () => void
}) {
  return (
    <button onClick={onSelect}
      className={`relative rounded-2xl border-2 overflow-hidden text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected
          ? "border-primary shadow-lg shadow-primary/15 scale-[1.02]"
          : "border-border hover:border-primary/40"
      }`}>
      <div className="h-24 p-3 flex flex-col gap-2" style={{ background: template.previewBg }}>
        <div className="flex items-center justify-between">
          <div className="h-2 w-14 rounded-full" style={{ background: template.previewText, opacity: 0.65 }} />
          <div className="h-4 w-10 rounded text-[7px] font-bold flex items-center justify-center"
            style={{ background: template.previewAccent, color: "#fff" }}>Cart</div>
        </div>
        <div className="grid grid-cols-3 gap-1 flex-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md overflow-hidden flex flex-col"
              style={{ background: template.previewCard, border: `1px solid ${template.previewText}1a` }}>
              <div className="flex-1" style={{ background: template.previewAccent, opacity: 0.12 }} />
              <div className="p-0.5">
                <div className="h-1.5 w-6 rounded text-[5px] font-bold flex items-center justify-center"
                  style={{ background: template.previewAccent, color: template.previewBg }}>+</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 py-2 bg-card border-t border-border flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{template.name}</p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{template.tagline}</p>
        </div>
        {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
      </div>
    </button>
  )
}

// ── Storefront tab ─────────────────────────────────────────────────────────
function StorefrontTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient()
  const { data: org } = useQuery({
    queryKey: ["orgs", orgId],
    queryFn: () => api.orgs.get(orgId),
    enabled: !!orgId,
  })

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null | "__reset__">(null)
  const [saved, setSaved] = useState(false)

  const currentTemplate = selectedTemplate ?? (org?.ui_template as TemplateId | null) ?? "dark_edge"
  const currentColor =
    selectedColor === "__reset__" ? null :
    selectedColor !== null ? selectedColor :
    org?.primary_color ?? null

  const updateUI = useMutation({
    mutationFn: () =>
      api.orgs.updateUI(orgId, {
        ui_template: currentTemplate,
        primary_color: currentColor,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["orgs", orgId], updated)
      setSelectedTemplate(null)
      setSelectedColor(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const isDirty =
    (selectedTemplate !== null && selectedTemplate !== org?.ui_template) ||
    (selectedColor !== null && (
      selectedColor === "__reset__" ? org?.primary_color !== null :
      selectedColor !== org?.primary_color
    ))

  const previewOrg = org
    ? { ...org, ui_template: currentTemplate, primary_color: currentColor }
    : undefined

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Template picker */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2"><LayoutTemplate className="h-4 w-4 text-primary" />Choose a Template</h2>
          <p className="text-xs text-muted-foreground mt-1">Controls the entire look of your public storefront.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} template={t} selected={currentTemplate === t.id}
              onSelect={() => { setSelectedTemplate(t.id as TemplateId); setSaved(false) }} />
          ))}
        </div>
      </section>

      {/* Accent colour */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Accent Colour</h2>
          <p className="text-xs text-muted-foreground mt-1">Override the template's default primary colour.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => { setSelectedColor("__reset__"); setSaved(false) }}
            className={`h-8 px-3 rounded-full text-xs font-medium border-2 transition-all ${
              currentColor === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}>Default</button>
          {PRIMARY_COLORS.map((c) => (
            <button key={c.hex} title={c.name}
              onClick={() => { setSelectedColor(c.hex); setSaved(false) }}
              className={`h-8 w-8 rounded-full border-2 transition-all relative ${
                currentColor === c.hex ? "border-foreground scale-110" : "border-transparent hover:scale-105 hover:border-border"
              }`}
              style={{ background: c.hex }}>
              {currentColor === c.hex && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white drop-shadow" />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Live preview */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4 text-primary" />Live Preview</h2>
        <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
          <TemplateShell org={previewOrg as any}>
            <div className="bg-background p-4 space-y-3">
              <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border">
                <div>
                  <p className="text-sm font-bold text-foreground">{org?.name ?? "Your Shop"}</p>
                  <p className="text-xs text-muted-foreground">{org?.category ?? "Online Store"}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                  <ShoppingCart className="h-3.5 w-3.5" /> Cart
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {["Wireless Headphones", "Running Shoes", "Leather Wallet"].map((name, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="aspect-square bg-accent/20 flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                    <div className="p-2 space-y-1.5">
                      <p className="text-[11px] font-medium text-foreground leading-snug line-clamp-1">{name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">₹{(i + 1) * 999}</p>
                        <div className="h-5 px-2 rounded bg-primary text-primary-foreground text-[9px] font-semibold flex items-center">Add</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TemplateShell>
        </div>
      </section>

      {/* Save bar */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => updateUI.mutate()} disabled={updateUI.isPending || !isDirty} className="min-w-[120px]">
          {updateUI.isPending ? "Saving…" : isDirty ? "Save Changes" : "No Changes"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-500">
            <CheckCircle2 className="h-4 w-4" /> Saved!
          </span>
        )}
        {updateUI.isError && (
          <span className="text-sm text-destructive">Save failed — try again</span>
        )}
        <Button variant="outline" size="sm" asChild className="ml-auto">
          <Link href={`/shop/${orgId}`} target="_blank">
            <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview live shop
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function OrgAdminDashboard() {
  const { shopUser, loading } = useAuth()
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "overview"
  const [tab, setTab] = useState<Tab>(initialTab)
  const [confirmProductId, setConfirmProductId] = useState<string | null>(null)
  const [confirmProductName, setConfirmProductName] = useState("")
  const topRef = useRef<HTMLDivElement>(null)

  const orgId = shopUser?.org_id ?? ""

  // Sync tab from URL whenever the search param changes (e.g. sidebar link)
  useEffect(() => {
    const urlTab = (searchParams.get("tab") as Tab | null) ?? "overview"
    setTab(urlTab)
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [searchParams])

  const handleTabChange = useCallback((t: Tab) => {
    router.push(t === "overview" ? "/org-admin" : `/org-admin?tab=${t}`)
  }, [router])

  const { data: org } = useQuery({
    queryKey: ["orgs", orgId],
    queryFn: () => api.orgs.get(orgId),
    enabled: !!orgId,
  })

  const { data: products = [] } = useQuery({
    queryKey: ["products", orgId],
    queryFn: () => api.products.list(orgId),
    enabled: !!orgId,
  })

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", orgId],
    queryFn: () => api.orders.list(orgId),
    enabled: !!orgId,
  })

  const deleteProduct = useMutation({
    mutationFn: (pid: string) => api.products.delete(pid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", orgId] })
      setConfirmProductId(null)
    },
  })

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!orgId) {
    return (
      <div className="max-w-md space-y-3 pt-8">
        <h1 className="text-2xl font-bold">Org Admin</h1>
        <p className="text-muted-foreground text-sm">Your account is not assigned to an organisation yet. Contact your platform admin.</p>
      </div>
    )
  }

  const activeProducts = products.filter((p) => p.is_active)
  const lowStock = products.filter((p) => p.stock < 5 && p.is_active)
  const pendingOrders = orders.filter((o) => o.status === "pending")
  const inTransit = orders.filter((o) => ["shipped", "out_for_delivery"].includes(o.status))
  const revenue = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0)
  const tpl = getTemplate(org?.ui_template)

  return (
    <div ref={topRef} className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {org?.logo ? (
            <img src={org.logo} alt={org.name} className="h-11 w-11 rounded-xl object-cover border border-border shrink-0" />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {org?.name?.[0]?.toUpperCase() ?? "O"}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{org?.name ?? "Org Admin"}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-xs text-muted-foreground">{org?.slug}.shopOS.in</p>
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/10">
                <LayoutTemplate className="h-2.5 w-2.5" />{tpl.name}
              </span>
              {org?.category && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  <Tag className="h-2.5 w-2.5" />{org.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/shop/${orgId}`} target="_blank">
            <Eye className="h-3.5 w-3.5 mr-1.5" />Preview Shop
          </Link>
        </Button>
      </div>

      {/* ── Tab bar ── */}
      <TabBar active={tab} onChange={handleTabChange} />

      {/* ══ OVERVIEW TAB ══ */}
      {tab === "overview" && (
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Boxes} label="Products" value={activeProducts.length}
              sub={`${products.length} total`} />
            <StatCard icon={ShoppingCart} label="Orders" value={orders.length}
              sub={`${pendingOrders.length} pending`}
              color={pendingOrders.length > 0 ? "orange" : "primary"} />
            <StatCard icon={TrendingUp} label="Revenue" color="green"
              value={revenue >= 1000 ? `₹${(revenue / 1000).toFixed(1)}k` : `₹${revenue.toLocaleString("en-IN")}`}
              sub={`from delivered orders`} />
            <StatCard icon={Truck} label="In Transit" value={inTransit.length}
              color={inTransit.length > 0 ? "yellow" : "primary"}
              sub={`${orders.filter(o => o.status === "delivered").length} delivered`} />
          </div>

          {/* Alerts */}
          {lowStock.length > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-yellow-400">Low stock alert</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    {lowStock.slice(0, 3).map(p => `${p.name} (${p.stock} left)`).join(" · ")}
                    {lowStock.length > 3 && ` · +${lowStock.length - 3} more`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Plus, label: "Add Product", href: `/orgs/${orgId}/products/new`, tab: null },
              { icon: LayoutTemplate, label: "Change Template", href: null, tab: "storefront" as Tab },
              { icon: Eye, label: "Preview Shop", href: `/shop/${orgId}`, tab: null, external: true },
            ].map(({ icon: Icon, label, href, tab: toTab, external }) => (
              toTab ? (
                <button key={label} onClick={() => handleTabChange(toTab)}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/40 transition-all group">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-center leading-snug">{label}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <Link key={label} href={href!} target={external ? "_blank" : undefined}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/40 transition-all group">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-center leading-snug">{label}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )
            ))}
          </div>

          {/* Recent orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Orders</CardTitle>
                {orders.length > 5 && (
                  <button onClick={() => handleTabChange("orders")}
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/25" />
                  <p className="text-muted-foreground text-sm">No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border">
                        {["Order", "Total", "Status", "Date"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.slice(0, 5).map((o) => (
                        <OrderRow key={o.id} order={o} orgId={orgId} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ PRODUCTS TAB ══ */}
      {tab === "products" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-sm">Products</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{activeProducts.length} active · {products.length - activeProducts.length} hidden</p>
              </div>
              <Button size="sm" asChild>
                <Link href={`/orgs/${orgId}/products/new`}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Product
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Package className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="font-medium text-sm">No products yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Add your first product to start selling</p>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/orgs/${orgId}/products/new`}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Add Product
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[580px]">
                  <thead>
                    <tr className="border-b border-border">
                      {["", "Name", "Price", "Stock", "Rating", "Status", ""].map((h, i) => (
                        <th key={i} className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-accent/40 transition-colors group">
                        <td className="px-4 py-3 w-12">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg border border-border bg-accent/30 flex items-center justify-center">
                              <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium leading-snug">{p.name}</p>
                          {p.category && <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">₹{Number(p.price).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${
                            p.stock === 0 ? "text-destructive" :
                            p.stock < 5 ? "text-yellow-400" : "text-foreground"
                          }`}>{p.stock}</span>
                          {p.stock < 5 && p.stock > 0 && (
                            <p className="text-[10px] text-yellow-400">Low stock</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {p.avg_rating != null ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{p.avg_rating.toFixed(1)}</span>
                              <span className="text-muted-foreground text-xs">({p.review_count})</span>
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.is_active
                              ? "bg-green-500/10 text-green-500 border border-green-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${p.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                            {p.is_active ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link href={`/orgs/${orgId}/products/${p.id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => { setConfirmProductId(p.id); setConfirmProductName(p.name) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══ ORDERS TAB ══ */}
      {tab === "orders" && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pending", value: pendingOrders.length, color: "text-orange-400" },
              { label: "In Transit", value: inTransit.length, color: "text-yellow-400" },
              { label: "Delivered", value: orders.filter(o => o.status === "delivered").length, color: "text-green-400" },
              { label: "Cancelled", value: orders.filter(o => o.status === "cancelled").length, color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">All Orders ({orders.length})</CardTitle>
                <p className="text-xs text-muted-foreground">Click status badge to update</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/25" />
                  <p className="text-muted-foreground text-sm">No orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border">
                        {["Order", "Total / Items", "Status", "Date"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((o) => (
                        <OrderRow key={o.id} order={o} orgId={orgId} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══ STOREFRONT TAB ══ */}
      {tab === "storefront" && <StorefrontTab orgId={orgId} />}

      {/* ── Confirm delete ── */}
      {confirmProductId && (
        <ConfirmDialog
          open={!!confirmProductId}
          onClose={() => setConfirmProductId(null)}
          onConfirm={() => deleteProduct.mutate(confirmProductId)}
          title="Delete Product"
          description={`Delete "${confirmProductName}"? This cannot be undone and will remove the product from your storefront.`}
          confirmText="Delete"
          variant="destructive"
          loading={deleteProduct.isPending}
        />
      )}
    </div>
  )
}
