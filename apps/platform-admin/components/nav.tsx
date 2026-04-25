"use client"
// Sidebar nav — links filtered by role, user avatar, logout
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  ShoppingCart, Package, ClipboardList, LogOut, Store
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { UserRole } from "@/lib/types"

const BASE_LINKS = [
  { href: "/dashboard",           label: "Dashboard",    icon: LayoutDashboard, roles: ["platform_admin"] as UserRole[] },
  { href: "/orgs-manager",        label: "Dashboard",    icon: LayoutDashboard, roles: ["orgs_manager"] as UserRole[] },
  { href: "/org-admin",           label: "Dashboard",    icon: LayoutDashboard, roles: ["org_admin"] as UserRole[] },
  { href: "/end-user",            label: "My Orders",    icon: ShoppingCart,    roles: ["end_user"] as UserRole[] },
  { href: "/orgs",                label: "Orgs",         icon: Building2,       roles: ["platform_admin", "orgs_manager"] as UserRole[] },
  { href: "/users",               label: "Users",        icon: Users,           roles: ["platform_admin", "orgs_manager", "org_admin"] as UserRole[] },
  { href: "/orders",              label: "Orders",       icon: ShoppingCart,    roles: ["platform_admin", "orgs_manager", "org_admin"] as UserRole[] },
  { href: "/admin",               label: "Admins",       icon: ShieldCheck,     roles: ["platform_admin"] as UserRole[] },
  { href: "/admin/org-requests",  label: "Org Requests", icon: ClipboardList,   roles: ["platform_admin"] as UserRole[] },
  { href: "/request-org",         label: "Request Org",  icon: Building2,       roles: ["end_user"] as UserRole[] },
]

export function Nav() {
  const path = usePathname()
  const { shopUser, signOut } = useAuth()
  const role = shopUser?.role as UserRole | undefined

  // For end_user: fetch accessible orgs to drive branding + shop links
  const { data: myOrgs = [] } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => api.users.myOrgs(),
    enabled: role === "end_user",
  })

  // Single-org end user: link Shop directly to that org's store
  const singleOrg = role === "end_user" && myOrgs.length === 1 ? myOrgs[0] : null

  // Build visible links — replace /shop with direct link for single-org users
  const visibleLinks = BASE_LINKS
    .filter((l) => {
      if (!role) return false
      // hide generic /shop entry — we add it back below per-org
      if (l.href === "/shop") return false
      return l.roles.includes(role)
    })

  // Inject shop link(s) at the top for end_user
  const shopLinks = role === "end_user"
    ? singleOrg
      ? [{ href: `/shop/${singleOrg.id}`, label: "Shop", icon: Store }]
      : myOrgs.map((o) => ({ href: `/shop/${o.id}`, label: o.name, icon: Store }))
    : []

  const allLinks = [...shopLinks, ...visibleLinks]

  // Sidebar logo label
  const brandLabel = singleOrg
    ? singleOrg.name
    : role === "end_user" && myOrgs.length > 1
    ? "My Shops"
    : null // falls back to ShopOS

  const linkClass = (href: string) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
      path === href || path.startsWith(href + "/")
        ? "bg-primary text-primary-foreground font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-accent"
    }`

  return (
    <aside className="w-56 bg-card flex flex-col border-r border-border shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-border shrink-0">
        <span className="text-lg font-bold tracking-tight">
          {brandLabel ?? <>Shop<span className="text-primary">OS</span></>}
        </span>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {shopUser?.role?.replace(/_/g, " ") ?? "Loading..."}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {/* Multi-org section header */}
        {role === "end_user" && myOrgs.length > 1 && (
          <p className="px-3 py-1 text-xs text-muted-foreground uppercase tracking-wide font-medium">Shops</p>
        )}
        {allLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            <Icon className="h-4 w-4 shrink-0" />{label}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border space-y-2 shrink-0">
        <Separator />
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {shopUser?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <p className="text-xs text-muted-foreground truncate flex-1">{shopUser?.email ?? "..."}</p>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />Sign out
        </Button>
      </div>
    </aside>
  )
}
