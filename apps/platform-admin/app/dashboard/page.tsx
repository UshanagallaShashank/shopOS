"use client"
// Platform Admin Dashboard — full platform stats: orgs, users, orders
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Building2, Users, ShoppingCart, TrendingUp } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge, PlanBadge } from "@/components/badges"

export default function DashboardPage() {
  const { shopUser, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if not platform_admin
  useEffect(() => {
    if (authLoading) return
    if (!shopUser || shopUser.role !== "platform_admin") {
      router.replace("/")
    }
  }, [shopUser, authLoading, router])

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["orgs"], queryFn: () => api.orgs.list(),
    enabled: shopUser?.role === "platform_admin",
  })
  const { data: users = [] } = useQuery({
    queryKey: ["users"], queryFn: () => api.users.list(),
    enabled: shopUser?.role === "platform_admin",
  })

  // Don't render if wrong role
  if (authLoading || !shopUser || shopUser.role !== "platform_admin") {
    return <div className="text-muted-foreground">Loading...</div>
  }

  const active = orgs.filter((o) => o.status === "active").length
  const suspended = orgs.filter((o) => o.status === "suspended").length
  const admins = users.filter((u) => u.role === "platform_admin" || u.role === "orgs_manager").length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Full platform overview — all orgs and users</p>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Building2} label="Total Orgs" value={orgs.length} />
            <StatCard icon={TrendingUp} label="Active Orgs" value={active} color="green" />
            <StatCard icon={Building2} label="Suspended" value={suspended} color="red" />
            <StatCard icon={Users} label="Admins" value={admins} />
          </div>

          {/* Plan breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {(["starter", "pro", "enterprise"] as const).map((plan) => (
              <Card key={plan}>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {plan} orgs
                  </p>
                  <p className="text-3xl font-bold">{orgs.filter((o) => o.plan === plan).length}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent orgs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Recent Orgs</CardTitle>
                <Link href="/orgs" className="text-xs text-primary hover:underline">View all →</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {["Name", "Plan", "Status", "Created"].map((h) => (
                      <th key={h} className="text-left px-5 py-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orgs.slice(0, 5).map((org) => (
                    <tr key={org.id} className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/orgs/${org.id}`}>
                      <td className="px-5 py-3 font-medium">{org.name}</td>
                      <td className="px-5 py-3"><PlanBadge plan={org.plan} /></td>
                      <td className="px-5 py-3"><StatusBadge status={org.status} /></td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color?: "green" | "red"
}) {
  const val = color === "green" ? "text-green-400" : color === "red" ? "text-destructive" : "text-foreground"
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold ${val}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
