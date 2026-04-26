"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard, Building2, Users, Users2, ShieldCheck,
  ShoppingCart, Package, ClipboardList, LogOut, Store,
  LayoutTemplate, FileText, ChevronRight, Sparkles,
  Menu, X, ChevronLeft, Search, Bell,
  BarChart3, TrendingUp, Settings, Heart,
  User, Truck, Star, HelpCircle, Boxes,
  Globe, IndianRupee, AlertTriangle, Activity,
  Zap, MessageSquare, ExternalLink, BadgeCheck,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import type { UserRole } from "@/lib/types"
import { Input } from "@/components/ui/input"

// ── Role palette ───────────────────────────────────────────────────────────
const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; dot: string; ring: string }> = {
  platform_admin: { label: "Platform Admin", color: "text-rose-400",    bg: "bg-rose-500/10",    dot: "bg-rose-400",    ring: "ring-rose-500/30" },
  orgs_manager:   { label: "Orgs Manager",   color: "text-blue-400",    bg: "bg-blue-500/10",    dot: "bg-blue-400",    ring: "ring-blue-500/30" },
  org_admin:      { label: "Org Admin",       color: "text-violet-400",  bg: "bg-violet-500/10",  dot: "bg-violet-400",  ring: "ring-violet-500/30" },
  end_user:       { label: "Customer",        color: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400", ring: "ring-emerald-500/30" },
}

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  badge?: number
  badgeColor?: string
  external?: boolean
  tag?: string          // "new" | "soon"
}
type NavGroup = { title?: string; items: NavItem[] }

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ text, size = "md", src }: { text: string; size?: "sm" | "md" | "lg"; src?: string | null }) {
  const cls = size === "lg" ? "h-10 w-10 text-sm" : size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"
  if (src) return <img src={src} alt={text} className={`${cls} rounded-xl object-cover border border-border shrink-0`} />
  return (
    <div className={`${cls} rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20`}>
      {text[0]?.toUpperCase() ?? "?"}
    </div>
  )
}

// ── NavLink ────────────────────────────────────────────────────────────────
function NavLink({ href, label, icon: Icon, exact = false, badge, badgeColor = "bg-destructive text-destructive-foreground", external, tag, collapsed }: NavItem & { collapsed?: boolean }) {
  const path = usePathname()
  const searchParams = useSearchParams()

  let isActive = false
  if (href.includes("?")) {
    const [hPath, hQuery] = href.split("?")
    const param = new URLSearchParams(hQuery)
    isActive = path === hPath && [...param.entries()].every(([k, v]) => searchParams.get(k) === v)
  } else {
    isActive = exact ? path === href : path === href || path.startsWith(href + "/")
  }

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      }`}
      title={collapsed ? label : undefined}
    >
      <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "" : "group-hover:scale-110"}`} />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{label}</span>
          {tag === "new" && (
            <span className="h-4 px-1.5 text-[9px] font-bold bg-primary/20 text-primary rounded-full flex items-center">NEW</span>
          )}
          {tag === "soon" && (
            <span className="h-4 px-1.5 text-[9px] font-bold bg-muted text-muted-foreground rounded-full flex items-center">SOON</span>
          )}
          {badge !== undefined && badge > 0 && (
            <span className={`ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full ${badgeColor}`}>
              {badge > 99 ? "99+" : badge}
            </span>
          )}
          {!badge && !tag && isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-60 shrink-0" />}
          {external && !isActive && <ExternalLink className="h-3 w-3 ml-auto opacity-40 shrink-0" />}
        </>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className={`absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[9px] font-bold rounded-full ${badgeColor}`}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  )
}

// ── Section divider ────────────────────────────────────────────────────────
function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 border-t border-border/50 mx-1" />
  return (
    <p className="px-3 pt-2 pb-1 text-[10px] text-muted-foreground/70 uppercase tracking-widest font-semibold select-none">
      {label}
    </p>
  )
}

// ── Quick stat chip ────────────────────────────────────────────────────────
function StatChip({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-base font-bold leading-none ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground/70 leading-none">{label}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// ROLE SIDEBARS
// ══════════════════════════════════════════════════════════════════════════

function PlatformAdminSidebar({ collapsed }: { collapsed: boolean }) {
  const { shopUser } = useAuth()

  const { data: orgs = [] } = useQuery({ queryKey: ["orgs-all"], queryFn: () => api.orgs.list(0, 200), staleTime: 60_000 })
  const { data: users = [] } = useQuery({ queryKey: ["users-all"], queryFn: () => api.users.list(0, 200), staleTime: 60_000 })
  const { data: orgRequests = [] } = useQuery({ queryKey: ["org-requests"], queryFn: () => api.orgRequests.list(), staleTime: 30_000 })

  const pendingRequests = orgRequests.filter(r => r.status === "pending").length
  const activeOrgs = orgs.filter(o => o.status === "active").length

  return (
    <>
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl bg-rose-500/5 border border-rose-500/15 p-3 grid grid-cols-3 gap-2">
          <StatChip label="Orgs" value={activeOrgs} color="text-foreground" />
          <StatChip label="Users" value={users.length} color="text-foreground" />
          <StatChip label="Pending" value={pendingRequests} color={pendingRequests > 0 ? "text-rose-400" : "text-foreground"} />
        </div>
      )}

      <SectionLabel label="Overview" collapsed={collapsed} />
      <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} exact collapsed={collapsed} />
      <NavLink href="/analytics" label="Analytics" icon={BarChart3} tag="soon" collapsed={collapsed} />
      <NavLink href="/revenue" label="Revenue" icon={IndianRupee} tag="soon" collapsed={collapsed} />

      <SectionLabel label="Manage" collapsed={collapsed} />
      <NavLink href="/orgs" label="Organisations" icon={Building2} badge={orgs.length} badgeColor="bg-muted text-muted-foreground" collapsed={collapsed} />
      <NavLink href="/users" label="Users" icon={Users} badge={users.length} badgeColor="bg-muted text-muted-foreground" collapsed={collapsed} />
      <NavLink href="/orders" label="All Orders" icon={ShoppingCart} collapsed={collapsed} />

      <SectionLabel label="Admin" collapsed={collapsed} />
      <NavLink href="/admin" label="Administrators" icon={ShieldCheck} exact collapsed={collapsed} />
      <NavLink href="/admin/org-requests" label="Org Requests" icon={ClipboardList}
        badge={pendingRequests} badgeColor="bg-rose-500 text-white" collapsed={collapsed} />
      <NavLink href="/activity" label="Activity Log" icon={Activity} tag="soon" collapsed={collapsed} />

      <SectionLabel label="System" collapsed={collapsed} />
      <NavLink href="/settings" label="Settings" icon={Settings} tag="soon" collapsed={collapsed} />
      <NavLink href="/notifications" label="Notifications" icon={Bell} tag="soon" collapsed={collapsed} />
    </>
  )
}

function OrgsManagerSidebar({ collapsed }: { collapsed: boolean }) {
  const { data: orgs = [] } = useQuery({ queryKey: ["orgs-all"], queryFn: () => api.orgs.list(0, 200), staleTime: 60_000 })
  const { data: orgRequests = [] } = useQuery({ queryKey: ["org-requests"], queryFn: () => api.orgRequests.list(), staleTime: 30_000 })
  const pendingRequests = orgRequests.filter(r => r.status === "pending").length
  const activeOrgs = orgs.filter(o => o.status === "active").length

  return (
    <>
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl bg-blue-500/5 border border-blue-500/15 p-3 grid grid-cols-3 gap-2">
          <StatChip label="Active" value={activeOrgs} color="text-blue-400" />
          <StatChip label="Total" value={orgs.length} color="text-foreground" />
          <StatChip label="Requests" value={pendingRequests} color={pendingRequests > 0 ? "text-blue-400" : "text-foreground"} />
        </div>
      )}

      <SectionLabel label="Overview" collapsed={collapsed} />
      <NavLink href="/orgs-manager" label="Dashboard" icon={LayoutDashboard} exact collapsed={collapsed} />

      <SectionLabel label="Manage" collapsed={collapsed} />
      <NavLink href="/orgs" label="Organisations" icon={Building2} collapsed={collapsed} />
      <NavLink href="/users" label="Users" icon={Users} collapsed={collapsed} />
      <NavLink href="/orders" label="Orders" icon={ShoppingCart} collapsed={collapsed} />

      <SectionLabel label="Requests" collapsed={collapsed} />
      <NavLink href="/admin/org-requests" label="Org Requests" icon={ClipboardList}
        badge={pendingRequests} badgeColor="bg-blue-500 text-white" collapsed={collapsed} />

      <SectionLabel label="System" collapsed={collapsed} />
      <NavLink href="/settings" label="Settings" icon={Settings} tag="soon" collapsed={collapsed} />
      <NavLink href="/notifications" label="Notifications" icon={Bell} tag="soon" collapsed={collapsed} />
    </>
  )
}

function OrgAdminSidebar({ collapsed, orgId }: { collapsed: boolean; orgId: string }) {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", orgId],
    queryFn: () => api.orders.list(orgId),
    enabled: !!orgId,
    staleTime: 30_000,
  })
  const { data: products = [] } = useQuery({
    queryKey: ["products", orgId],
    queryFn: () => api.products.list(orgId),
    enabled: !!orgId,
    staleTime: 60_000,
  })

  const pendingOrders = orders.filter(o => o.status === "pending").length
  const lowStock = products.filter(p => p.stock < 5 && p.is_active).length
  const revenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0)
  const revenueLabel = revenue >= 1000 ? `₹${(revenue / 1000).toFixed(1)}k` : `₹${revenue}`

  return (
    <>
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl bg-violet-500/5 border border-violet-500/15 p-3 grid grid-cols-3 gap-2">
          <StatChip label="Pending" value={pendingOrders} color={pendingOrders > 0 ? "text-orange-400" : "text-foreground"} />
          <StatChip label="Low Stock" value={lowStock} color={lowStock > 0 ? "text-yellow-400" : "text-foreground"} />
          <StatChip label="Revenue" value={revenueLabel} color="text-violet-400" />
        </div>
      )}

      <SectionLabel label="My Store" collapsed={collapsed} />
      <NavLink href="/org-admin" label="Overview" icon={LayoutDashboard} exact collapsed={collapsed} />
      <NavLink href="/org-admin?tab=products" label="Products" icon={Boxes}
        badge={lowStock > 0 ? lowStock : undefined} badgeColor="bg-yellow-500 text-black"
        collapsed={collapsed} />
      <NavLink href="/org-admin?tab=orders" label="Orders" icon={ShoppingCart}
        badge={pendingOrders} badgeColor="bg-orange-500 text-white"
        collapsed={collapsed} />
      <NavLink href="/org-admin?tab=overview" label="Revenue" icon={TrendingUp} collapsed={collapsed} />

      <SectionLabel label="Storefront" collapsed={collapsed} />
      <NavLink href="/org-admin?tab=storefront" label="Templates" icon={LayoutTemplate} collapsed={collapsed} />
      <NavLink href={`/shop/${orgId}`} label="Preview Shop" icon={Globe} external collapsed={collapsed} />

      <SectionLabel label="Catalogue" collapsed={collapsed} />
      <NavLink href={`/orgs/${orgId}/products/new`} label="Add Product" icon={Zap} collapsed={collapsed} />
      <NavLink href={`/orgs/${orgId}`} label="Org Profile" icon={Building2} collapsed={collapsed} />

      <SectionLabel label="Settings" collapsed={collapsed} />
      <NavLink href="/settings" label="Store Settings" icon={Settings} tag="soon" collapsed={collapsed} />
      <NavLink href="/notifications" label="Notifications" icon={Bell} tag="soon" collapsed={collapsed} />
    </>
  )
}

function EndUserSidebar({ collapsed, myOrgs }: { collapsed: boolean; myOrgs: Array<{ id: string; name: string; logo: string | null; category: string | null }> }) {
  const { data: myOrders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.orders.my(),
    staleTime: 30_000,
  })

  const activeOrders = myOrders.filter(o =>
    !["delivered", "cancelled", "refunded"].includes(o.status)
  ).length
  const totalSpent = myOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0)
  const spentLabel = totalSpent >= 1000 ? `₹${(totalSpent / 1000).toFixed(1)}k` : `₹${totalSpent}`

  return (
    <>
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 grid grid-cols-3 gap-2">
          <StatChip label="Orders" value={myOrders.length} color="text-foreground" />
          <StatChip label="Active" value={activeOrders} color={activeOrders > 0 ? "text-emerald-400" : "text-foreground"} />
          <StatChip label="Spent" value={spentLabel} color="text-emerald-400" />
        </div>
      )}

      {myOrgs.length > 0 && (
        <>
          <SectionLabel label={myOrgs.length === 1 ? "My Shop" : "My Shops"} collapsed={collapsed} />
          {myOrgs.map((o) => (
            <NavLink key={o.id} href={`/shop/${o.id}`} label={o.name} icon={Store} collapsed={collapsed} />
          ))}
        </>
      )}

      <SectionLabel label="Shopping" collapsed={collapsed} />
      <NavLink href="/end-user" label="My Orders" icon={Package} exact
        badge={activeOrders} badgeColor="bg-emerald-500 text-white" collapsed={collapsed} />
      <NavLink href="/end-user?tab=tracking" label="Track Deliveries" icon={Truck} tag="soon" collapsed={collapsed} />
      <NavLink href="/end-user?tab=wishlist" label="Wishlist" icon={Heart} tag="soon" collapsed={collapsed} />

      <SectionLabel label="Account" collapsed={collapsed} />
      <NavLink href="/profile" label="My Profile" icon={User} tag="soon" collapsed={collapsed} />
      <NavLink href="/request-org" label="Open a Store" icon={FileText} collapsed={collapsed} />
      <NavLink href="/notifications" label="Notifications" icon={Bell} tag="soon" collapsed={collapsed} />

      <SectionLabel label="Support" collapsed={collapsed} />
      <NavLink href="/help" label="Help & FAQ" icon={HelpCircle} tag="soon" collapsed={collapsed} />
      <NavLink href="/support" label="Contact Support" icon={MessageSquare} tag="soon" collapsed={collapsed} />
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// SIDEBAR SHELL
// ══════════════════════════════════════════════════════════════════════════

function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { shopUser, signOut } = useAuth()
  const role = shopUser?.role as UserRole | undefined
  const [searchQuery, setSearchQuery] = useState("")

  const { data: myOrgs = [] } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => api.users.myOrgs(),
    enabled: role === "end_user",
    staleTime: 60_000,
  })
  const { data: myOrgData } = useQuery({
    queryKey: ["orgs", shopUser?.org_id],
    queryFn: () => api.orgs.get(shopUser!.org_id!),
    enabled: role === "org_admin" && !!shopUser?.org_id,
    staleTime: 60_000,
  })

  if (!role) return null

  const meta = ROLE_META[role]

  const headerContent = (() => {
    if (role === "org_admin" && myOrgData) {
      return (
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <Avatar text={myOrgData.name} src={myOrgData.logo} size="md" />
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-400`} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{myOrgData.name}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
          )}
        </div>
      )
    }
    if (role === "end_user") {
      return (
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <Avatar text={shopUser?.email ?? "U"} size="md" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{shopUser?.email?.split("@")[0] ?? "Customer"}</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                <BadgeCheck className="h-2.5 w-2.5" /> Verified
              </span>
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {!collapsed && (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-foreground">Shop<span className="text-primary">OS</span></span>
              <Sparkles className="h-3.5 w-3.5 text-primary/60" />
            </div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
        )}
        {collapsed && <Sparkles className="h-5 w-5 text-primary" />}
      </div>
    )
  })()

  return (
    <>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border shrink-0 flex items-center justify-between gap-2">
        {headerContent}
        <button
          onClick={onToggle}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors shrink-0 text-muted-foreground"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Quick search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-accent/50 border-0 focus-visible:ring-1 text-xs"
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {role === "platform_admin" && <PlatformAdminSidebar collapsed={collapsed} />}
        {role === "orgs_manager" && <OrgsManagerSidebar collapsed={collapsed} />}
        {role === "org_admin" && <OrgAdminSidebar collapsed={collapsed} orgId={shopUser?.org_id ?? ""} />}
        {role === "end_user" && <EndUserSidebar collapsed={collapsed} myOrgs={myOrgs} />}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-border shrink-0 space-y-1.5">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-accent/30">
            <Avatar text={shopUser?.email ?? "?"} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{shopUser?.email ?? "…"}</p>
              <p className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</p>
            </div>
            <button
              title="Sign out"
              onClick={() => signOut()}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Avatar text={shopUser?.email ?? "?"} size="md" />
            <button onClick={() => signOut()} title="Sign out"
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export function ImprovedNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card/95 backdrop-blur border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">Shop<span className="text-primary">OS</span></span>
          <Sparkles className="h-4 w-4 text-primary/60" />
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={`lg:hidden fixed top-14 bottom-0 left-0 w-72 bg-card flex flex-col border-r border-border z-40 transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent collapsed={false} onToggle={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-card border-r border-border shrink-0 overflow-hidden transition-all duration-200 ${collapsed ? "w-[72px]" : "w-64"}`}>
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14 shrink-0" />
    </>
  )
}
