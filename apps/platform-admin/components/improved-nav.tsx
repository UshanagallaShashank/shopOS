"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  ShoppingCart, Package, ClipboardList, LogOut, Store,
  LayoutTemplate, FileText, ChevronRight, Sparkles,
  Menu, X, Bell, Search, ChevronLeft,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import type { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ── Role metadata ──────────────────────────────────────────────────────────
const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; dot: string }> = {
  platform_admin: { label: "Platform Admin", color: "text-rose-400",  bg: "bg-rose-500/10",    dot: "bg-rose-400" },
  orgs_manager:   { label: "Orgs Manager",   color: "text-blue-400",  bg: "bg-blue-500/10",    dot: "bg-blue-400" },
  org_admin:      { label: "Org Admin",       color: "text-violet-400",bg: "bg-violet-500/10",  dot: "bg-violet-400" },
  end_user:       { label: "Customer",        color: "text-emerald-400",bg: "bg-emerald-500/10",dot: "bg-emerald-400" },
}

type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean; badge?: number }
type NavGroup = { title?: string; items: NavItem[] }

// ── Per-role nav groups ────────────────────────────────────────────────────
const PLATFORM_ADMIN_GROUPS: NavGroup[] = [
  {
    title: "Platform",
    items: [
      { href: "/dashboard",          label: "Dashboard",       icon: LayoutDashboard, exact: true },
      { href: "/orgs",               label: "Organisations",   icon: Building2 },
      { href: "/users",              label: "Users",           icon: Users },
      { href: "/orders",             label: "Orders",          icon: ShoppingCart },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin",              label: "Administrators",  icon: ShieldCheck },
      { href: "/admin/org-requests", label: "Org Requests",   icon: ClipboardList },
    ],
  },
]

const ORGS_MANAGER_GROUPS: NavGroup[] = [
  {
    title: "Management",
    items: [
      { href: "/orgs-manager", label: "Dashboard",     icon: LayoutDashboard, exact: true },
      { href: "/orgs",         label: "Organisations", icon: Building2 },
      { href: "/users",        label: "Users",         icon: Users },
    ],
  },
]

const ORG_ADMIN_GROUPS: NavGroup[] = [
  {
    title: "My Store",
    items: [
      { href: "/org-admin", label: "Dashboard",  icon: LayoutDashboard, exact: true },
    ],
  },
]

const END_USER_GROUPS: NavGroup[] = [
  {
    title: "Account",
    items: [
      { href: "/end-user",    label: "My Orders",    icon: Package, exact: true },
      { href: "/request-org", label: "Request Store", icon: FileText },
    ],
  },
]

const ROLE_GROUPS: Record<UserRole, NavGroup[]> = {
  platform_admin: PLATFORM_ADMIN_GROUPS,
  orgs_manager:   ORGS_MANAGER_GROUPS,
  org_admin:      ORG_ADMIN_GROUPS,
  end_user:       END_USER_GROUPS,
}

// ── NavLink ────────────────────────────────────────────────────────────────
function NavLink({ href, label, icon: Icon, exact = false, badge, collapsed }: NavItem & { collapsed?: boolean }) {
  const path = usePathname()
  const isActive = exact ? path === href : path === href || path.startsWith(href + "/")
  
  return (
    <Link
      href={href}
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
          {badge && badge > 0 && (
            <span className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
          {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
        </>
      )}
      {collapsed && badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  )
}

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

// ── Sidebar Content ────────────────────────────────────────────────────────
function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const path = usePathname()
  const searchParams = useSearchParams()
  const { shopUser, signOut } = useAuth()
  const role = shopUser?.role as UserRole | undefined
  const [searchQuery, setSearchQuery] = useState("")

  const { data: myOrgs = [] } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => api.users.myOrgs(),
    enabled: role === "end_user",
  })

  const { data: myOrgData } = useQuery({
    queryKey: ["orgs", shopUser?.org_id],
    queryFn: () => api.orgs.get(shopUser!.org_id!),
    enabled: role === "org_admin" && !!shopUser?.org_id,
  })

  // Mock notification count (replace with real API call)
  const notificationCount = 3

  if (!role) return null

  const meta = ROLE_META[role]
  const groups = ROLE_GROUPS[role] ?? []

  // Build shop links for end_user
  const shopGroups: NavGroup[] =
    role === "end_user" && myOrgs.length > 0
      ? [{
          title: myOrgs.length === 1 ? undefined : "My Shops",
          items: myOrgs.map((o) => ({
            href: `/shop/${o.id}`,
            label: o.name,
            icon: Store,
          })),
        }]
      : []

  const allGroups = [...shopGroups, ...groups]

  // Filter nav items by search query
  const filteredGroups = searchQuery
    ? allGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(group => group.items.length > 0)
    : allGroups

  // Header identity for each role
  const headerContent = (() => {
    if (role === "org_admin" && myOrgData) {
      return (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar text={myOrgData.name} src={myOrgData.logo} size="md" />
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
    return (
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-foreground">
            Shop<span className="text-primary">OS</span>
          </span>
          {!collapsed && <Sparkles className="h-3.5 w-3.5 text-primary/60" />}
        </div>
        {!collapsed && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        )}
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
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-accent/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>
      )}

      {/* Navigation groups */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {filteredGroups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.title && !collapsed && (
              <p className="px-3 pb-1 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} {...item} collapsed={collapsed} />
            ))}
          </div>
        ))}

        {/* Storefront quick-link for org_admin */}
        {role === "org_admin" && myOrgData && (
          <div className="space-y-0.5">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Storefront
              </p>
            )}
            <Link
              href={`/shop/${shopUser?.org_id}`}
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all group"
              title={collapsed ? "Preview Shop" : undefined}
            >
              <Store className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
              {!collapsed && (
                <>
                  <span className="truncate flex-1">Preview Shop</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/60">↗</span>
                </>
              )}
            </Link>
            <Link
              href="/org-admin?tab=storefront"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                path === "/org-admin" && searchParams.get("tab") === "storefront"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }`}
              title={collapsed ? "Templates" : undefined}
            >
              <LayoutTemplate className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
              {!collapsed && <span className="truncate flex-1">Templates</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-border shrink-0 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-accent/30">
            <Avatar text={shopUser?.email ?? "?"} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {shopUser?.email ?? "..."}
              </p>
              <p className={`text-[10px] font-medium ${meta.color} capitalize`}>
                {role.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <Avatar text={shopUser?.email ?? "?"} size="md" />
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="flex items-center justify-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Sign out</span>}
        </button>
      </div>
    </>
  )
}

// ── Main nav ───────────────────────────────────────────────────────────────
export function ImprovedNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Shop<span className="text-primary">OS</span>
          </span>
          <Sparkles className="h-4 w-4 text-primary/60" />
        </div>
        <div className="flex items-center gap-2">
          <button className="relative h-10 w-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full">
              3
            </span>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-16 bottom-0 left-0 w-72 bg-card flex flex-col border-r border-border z-40 transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent collapsed={false} onToggle={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-card border-r border-border shrink-0 overflow-y-auto transition-all ${
          collapsed ? "w-20" : "w-60"
        }`}
      >
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Mobile spacer */}
      <div className="lg:hidden h-16" />
    </>
  )
}
