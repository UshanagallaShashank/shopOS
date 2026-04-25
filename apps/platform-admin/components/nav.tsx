"use client"
// Sidebar nav — active route highlight, user avatar, logout button
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Building2, Users, ShieldCheck, LogOut } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orgs", label: "Orgs", icon: Building2 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/admin", label: "Admins", icon: ShieldCheck },
]

export function Nav() {
  const path = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <aside className="w-56 bg-card flex flex-col border-r border-border shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <span className="text-lg font-bold tracking-tight">
          Shop<span className="text-primary">OS</span>
        </span>
        <p className="text-xs text-muted-foreground mt-0.5">Platform Admin</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/")
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-primary text-primary-foreground font-medium"
                       : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section at bottom */}
      <div className="p-3 border-t border-border space-y-2">
        <Separator />
        <div className="flex items-center gap-2 px-2 py-1">
          {/* Avatar circle with first letter of email */}
          <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <p className="text-xs text-muted-foreground truncate flex-1">{user?.email ?? "..."}</p>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
