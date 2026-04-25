"use client"
// Org Admin Dashboard — tabbed: Overview | Products | Orders | Storefront
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  Package, ShoppingCart, Plus, Pencil, Trash2,
  Star, ImageOff, Eye, LayoutTemplate, CheckCircle2,
  TrendingUp, AlertTriangle, Clock,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge } from "@/components/badges"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TEMPLATES, PRIMARY_COLORS, getTemplate } from "@/lib/templates"
import { TemplateShell } from "@/components/template-shell"
import type { TemplateId } from "@/lib/templates"

type Tab = "overview" | "products" | "orders" | "storefront"

// ── Tab bar ────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "storefront", label: "Storefront" },
  ]
  return (
    <div className="flex gap-1 border-b border-border pb-0">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === t.id
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: number | string
  sub?: string; accent?: string
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-2.5 rounded-xl ${accent ?? "bg-primary/10"}`}>
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

// ── Template picker card ───────────────────────────────────────────────────
function TemplateCard({
  template, selected, onSelect,
}: {
  template: typeof TEMPLATES[0]
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative rounded-2xl border-2 overflow-hidden text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected
          ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
          : "border-border hover:border-primary/40"
      }`}
    >
      {/* Mini storefront preview */}
      <div
        className="h-28 p-3 space-y-2 flex flex-col"
        style={{ background: template.previewBg }}
      >
        {/* Fake header bar */}
        <div className="flex items-center justify-between">
          <div className="h-2 w-16 rounded-full" style={{ background: template.previewText, opacity: 0.7 }} />
          <div className="h-5 w-12 rounded-md text-[8px] font-bold flex items-center justify-center"
            style={{ background: template.previewAccent, color: "#fff" }}>
            Cart
          </div>
        </div>
        {/* Fake product grid */}
        <div className="grid grid-cols-3 gap-1.5 flex-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg flex flex-col overflow-hidden"
              style={{ background: template.previewCard, border: `1px solid ${template.previewText}18` }}>
              <div className="flex-1" style={{ background: template.previewAccent, opacity: 0.15 }} />
              <div className="p-1 space-y-0.5">
                <div className="h-1 w-full rounded-full" style={{ background: template.previewText, opacity: 0.5 }} />
                <div className="h-2 w-10 rounded-sm text-[6px] font-bold flex items-center justify-center mt-0.5"
                  style={{ background: template.previewAccent, color: template.previewBg }}>
                  Add
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Label */}
      <div className="p-3 bg-card border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{template.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{template.tagline}</p>
          </div>
          {selected && (
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          )}
        </div>
      </div>
    </button>
  )
}

// ── Storefront settings tab ────────────────────────────────────────────────
function StorefrontTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient()

  const { data: org } = useQuery({
    queryKey: ["orgs", orgId],
    queryFn: () => api.orgs.get(orgId),
    enabled: !!orgId,
  })

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const currentTemplate = selectedTemplate ?? (org?.ui_template as TemplateId | null) ?? "dark_edge"
  const currentColor = selectedColor ?? org?.primary_color ?? null

  const updateUI = useMutation({
    mutationFn: () =>
      api.orgs.updateUI(orgId, {
        ui_template: currentTemplate,
        primary_color: currentColor ?? undefined,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["orgs", orgId], updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const isDirty =
    (selectedTemplate !== null && selectedTemplate !== org?.ui_template) ||
    (selectedColor !== null && selectedColor !== org?.primary_color)

  // Build a fake "org" for the live preview
  const previewOrg = org
    ? { ...org, ui_template: currentTemplate, primary_color: currentColor }
    : undefined

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Template picker */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Choose a Template</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            This controls the look and feel of your public storefront.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TEMPLATES.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              selected={currentTemplate === t.id}
              onSelect={() => { setSelectedTemplate(t.id as TemplateId); setSaved(false) }}
            />
          ))}
        </div>
      </div>

      {/* Primary colour swatches */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Accent Colour</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overrides the template&apos;s default primary colour. Leave unset to use the template default.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* "Use template default" option */}
          <button
            onClick={() => { setSelectedColor(null); setSaved(false) }}
            className={`h-8 px-3 rounded-full text-xs font-medium border-2 transition-all ${
              currentColor === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            Default
          </button>
          {PRIMARY_COLORS.map((c) => (
            <button
              key={c.hex}
              title={c.name}
              onClick={() => { setSelectedColor(c.hex); setSaved(false) }}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                currentColor === c.hex ? "border-foreground scale-110" : "border-transparent hover:scale-105"
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Live preview strip */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Live Preview</h2>
        <TemplateShell org={previewOrg as any} className="rounded-2xl border border-border overflow-hidden">
          <div className="bg-background p-4 space-y-3">
            {/* Fake store header */}
            <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3 border border-border">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">{org?.name ?? "Your Shop"}</p>
                <p className="text-xs text-muted-foreground">{org?.slug}.shopOS.in</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                <ShoppingCart className="h-3.5 w-3.5" /> Cart
              </div>
            </div>
            {/* Fake product grid */}
            <div className="grid grid-cols-3 gap-3">
              {["Kurta Set", "Cotton Saree", "Bangles Pack"].map((name, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="aspect-square bg-accent/20 flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    <p className="text-xs font-medium text-foreground leading-snug">{name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">₹{(i + 1) * 299}</p>
                      <div className="h-5 px-2 rounded-md bg-primary text-primary-foreground text-[10px] font-medium flex items-center">Add</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TemplateShell>
      </div>

      {/* Save / feedback */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => updateUI.mutate()}
          disabled={updateUI.isPending || !isDirty}
        >
          {updateUI.isPending ? "Saving…" : "Save Changes"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-500">
            <CheckCircle2 className="h-4 w-4" /> Saved!
          </span>
        )}
        <Button variant="outline" size="sm" asChild>
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
  const [tab, setTab] = useState<Tab>("overview")
  const [confirmProductId, setConfirmProductId] = useState<string | null>(null)
  const [confirmProductName, setConfirmProductName] = useState("")

  const orgId = shopUser?.org_id ?? ""

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

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>

  if (!orgId) {
    return (
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-bold">Org Admin</h1>
        <p className="text-muted-foreground text-sm">
          Your account is not assigned to an org yet. Contact a platform admin.
        </p>
      </div>
    )
  }

  const lowStock = products.filter((p) => p.stock < 5 && p.is_active)
  const pendingOrders = orders.filter((o) => o.status === "pending")
  const revenue = orders.reduce((s, o) => s + Number(o.total), 0)
  const tpl = getTemplate(org?.ui_template)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {org?.logo && (
            <img src={org.logo} alt={org.name} className="h-10 w-10 rounded-xl object-cover border border-border" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{org?.name ?? "Org Admin"}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {org?.slug}.shopOS.in
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {tpl.name}
              </span>
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/shop/${orgId}`} target="_blank">
            <Eye className="h-3.5 w-3.5 mr-1.5" />Preview Shop
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <TabBar active={tab} onChange={setTab} />

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Package} label="Products" value={products.length}
              sub={`${products.filter(p => p.is_active).length} active`} />
            <StatCard icon={ShoppingCart} label="Total Orders" value={orders.length} />
            <StatCard icon={TrendingUp} label="Revenue"
              value={`₹${revenue.toLocaleString("en-IN")}`} />
            <StatCard icon={Clock} label="Pending Orders" value={pendingOrders.length}
              accent={pendingOrders.length > 0 ? "bg-orange-400/10" : undefined} />
          </div>

          {lowStock.length > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-400">Low stock alert</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {lowStock.map(p => p.name).join(", ")} — restock soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-1.5">
              <Link href={`/orgs/${orgId}/products/new`}>
                <Plus className="h-5 w-5" />
                <span className="text-xs font-medium">Add Product</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-1.5"
              onClick={() => setTab("storefront")}>
              <LayoutTemplate className="h-5 w-5" />
              <span className="text-xs font-medium">Change Template</span>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-1.5">
              <Link href={`/shop/${orgId}`} target="_blank">
                <Eye className="h-5 w-5" />
                <span className="text-xs font-medium">Preview Shop</span>
              </Link>
            </Button>
          </div>

          {/* Recent orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Orders</CardTitle>
                {orders.length > 5 && (
                  <button onClick={() => setTab("orders")} className="text-xs text-primary hover:underline">
                    View all
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm p-5">No orders yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>{["Order", "Total", "Status", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-accent/50">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}…</td>
                        <td className="px-4 py-2.5 font-medium">₹{Number(o.total).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-2.5"><OrderStatusBadge status={o.status} /></td>
                        <td className="px-4 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Products ── */}
      {tab === "products" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Products ({products.length})</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/orgs/${orgId}/products/new`}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Product
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Package className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">No products yet.</p>
                <Button size="sm" asChild>
                  <Link href={`/orgs/${orgId}/products/new`}>Add your first product</Link>
                </Button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>{["", "Name", "Price", "Stock", "Rating", "Active", ""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg border border-border bg-accent/30 flex items-center justify-center">
                            <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">₹{Number(p.price).toLocaleString("en-IN")}</td>
                      <td className={`px-4 py-3 font-medium ${p.stock === 0 ? "text-destructive" : p.stock < 5 ? "text-yellow-400" : ""}`}>
                        {p.stock}
                      </td>
                      <td className="px-4 py-3">
                        {p.avg_rating != null ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            {p.avg_rating.toFixed(1)}
                            <span className="text-muted-foreground text-xs">({p.review_count})</span>
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={p.is_active ? "text-green-400 text-xs font-medium" : "text-muted-foreground text-xs"}>
                          {p.is_active ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/orgs/${orgId}/products/${p.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setConfirmProductId(p.id); setConfirmProductName(p.name) }}>
                            <Trash2 className="h-3.5 w-3.5" />
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
      )}

      {/* ── Orders ── */}
      {tab === "orders" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm p-5">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>{["Order", "Total", "Status", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-accent/50">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}…</td>
                      <td className="px-4 py-2.5 font-medium">₹{Number(o.total).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-2.5"><OrderStatusBadge status={o.status} /></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Storefront ── */}
      {tab === "storefront" && <StorefrontTab orgId={orgId} />}

      {/* Delete product confirmation */}
      {confirmProductId && (
        <ConfirmDialog
          open={!!confirmProductId}
          onClose={() => setConfirmProductId(null)}
          onConfirm={() => deleteProduct.mutate(confirmProductId)}
          title="Delete Product"
          description={`Are you sure you want to delete "${confirmProductName}"? This cannot be undone.`}
          confirmText="Delete"
          variant="destructive"
          loading={deleteProduct.isPending}
        />
      )}
    </div>
  )
}
