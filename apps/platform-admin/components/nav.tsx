"use client"
// Sidebar nav — links filtered by role, user avatar, logout
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, Users, ShieldCheck,
  ShoppingCart, Package, ClipboardList, LogOut
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { UserRole } from "@/lib/types"

// Each link declares which roles can see it
const ALL_LINKS = [
  // Dashboards — one per role
  { href: "/dashboard",           label: "Dashboard",      icon: LayoutDashboard, roles: ["platform_admin"] as UserRole[] },
  { href: "/orgs-manager",        label: "Dashboard",      icon: LayoutDashboard, roles: ["orgs_manager"] as UserRole[] },
  { href: "/org-admin",           label: "Dashboard",      icon: LayoutDashboard, roles: ["org_admin"] as UserRole[] },
  { href: "/end-user",            label: "My Orders",      icon: ShoppingCart,    roles: ["end_user"] as UserRole[] },

  // Resources — role-gated
  { href: "/orgs",                label: "Orgs",           icon: Building2,       roles: ["platform_admin", "orgs_manager"] as UserRole[] },
  { href: "/users",               label: "Users",          icon: Users,           roles: ["platform_admin", "orgs_manager", "org_admin"] as UserRole[] },
  { href: "/orders",              label: "Orders",         icon: ShoppingCart,    roles: ["platform_admin", "orgs_manager", "org_admin"] as UserRole[] },
  { href: "/admin",               label: "Admins",         icon: ShieldCheck,     roles: ["platform_admin"] as UserRole[] },
  { href: "/admin/role-requests", label: "Role Requests",  icon: ClipboardList,   roles: ["platform_admin"] as UserRole[] },
  { href: "/role-request",        label: "Request Role",   icon: ClipboardList,   roles: ["end_user", "org_admin"] as UserRole[] },
]

export function Nav() {
  const path = usePathname()
  const { shopUser, signOut } = useAuth()

  function handleSignOut() {
    signOut() // useAuth.signOut handles token cleanup + redirect
  }

  // Filter links to only those the current role can see
  const role = shopUser?.role as UserRole | undefined
  const visibleLinks = ALL_LINKS.filter((l) => {
    // If no role yet (loading), show nothing
    if (!role) return false
    // Show link only if user's role is in the allowed roles
    return l.roles.includes(role)
  })

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
          Shop<span className="text-primary">OS</span>
        </span>
        {/* Show the user's role as a subtitle */}
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {shopUser?.role?.replace("_", " ") ?? "Loading..."}
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {visibleLinks.map(({ href, label, icon: Icon }) => (
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
          onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />Sign out
        </Button>
      </div>
    </aside>
  )
}
