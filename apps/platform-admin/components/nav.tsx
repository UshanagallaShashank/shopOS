"use client"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  ShoppingCart, Package, ClipboardList, LogOut, Store,
  LayoutTemplate, FileText,
  ChevronRight, Sparkles,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import type { UserRole } from "@/lib/types"

// ── Role metadata ──────────────────────────────────────────────────────────
const ROLE_META: Record<UserRole, { label: string; color: string; bg: string; dot: string }> = {
  platform_admin: { label: "Platform Admin", color: "text-rose-400",  bg: "bg-rose-500/10",    dot: "bg-rose-400" },
  orgs_manager:   { label: "Orgs Manager",   color: "text-blue-400",  bg: "bg-blue-500/10",    dot: "bg-blue-400" },
  org_admin:      { label: "Org Admin",       color: "text-violet-400",bg: "bg-violet-500/10",  dot: "bg-violet-400" },
  end_user:       { label: "Customer",        color: "text-emerald-400",bg: "bg-emerald-500/10",dot: "bg-emerald-400" },
}

type NavItem = { href: string; label: string; icon: React.ElementType; exact?: boolean }
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
function NavLink({ href, label, icon: Icon, exact = false }: NavItem) {
  const path = usePathname()
  const isActive = exact ? path === href : path === href || path.startsWith(href + "/")
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "" : "group-hover:scale-110"}`} />
      <span className="truncate">{label}</span>
      {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
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

// ── Main nav ───────────────────────────────────────────────────────────────
export function Nav() {
  const path = usePathname()
  const searchParams = useSearchParams()
  const { shopUser, signOut } = useAuth()
  const role = shopUser?.role as UserRole | undefined

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

  // Header identity for each role
  const headerContent = (() => {
    if (role === "org_admin" && myOrgData) {
      return (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar text={myOrgData.name} src={myOrgData.logo} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{myOrgData.name}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
        </div>
      )
    }
    return (
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-foreground">
            Shop<span className="text-primary">OS</span>
          </span>
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>
    )
  })()

  return (
    <aside className="w-60 bg-card flex flex-col border-r border-border shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        {headerContent}
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {allGroups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.title && (
              <p className="px-3 pb-1 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        ))}

        {/* Storefront quick-link for org_admin */}
        {role === "org_admin" && myOrgData && (
          <div className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
              Storefront
            </p>
            <Link
              href={`/shop/${shopUser?.org_id}`}
              target="_blank"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all group"
            >
              <Store className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">Preview Shop</span>
              <span className="ml-auto text-[10px] text-muted-foreground/60">↗</span>
            </Link>
            <Link
              href="/org-admin?tab=storefront"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                path === "/org-admin" && searchParams.get("tab") === "storefront"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }`}
            >
              <LayoutTemplate className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate">Templates</span>
            </Link>
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-border shrink-0 space-y-2">
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
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
