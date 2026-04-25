"use client"
// Orgs Manager Dashboard — focused on org health, plan distribution, quick actions
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Building2, Plus, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlanBadge, StatusBadge } from "@/components/badges"

export default function OrgsManagerDashboard() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["orgs"], queryFn: () => api.orgs.list(),
  })

  const suspended = orgs.filter((o) => o.status === "suspended")
  const maintenance = orgs.filter((o) => o.status === "maintenance")

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Orgs Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all organisations on the platform</p>
        </div>
        <Button asChild>
          <Link href="/orgs/new"><Plus className="h-4 w-4 mr-1" />New Org</Link>
        </Button>
      </div>

      {/* Alert: orgs needing attention */}
      {(suspended.length > 0 || maintenance.length > 0) && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
            <p className="text-sm">
              <span className="font-medium">{suspended.length} suspended</span> and{" "}
              <span className="font-medium">{maintenance.length} in maintenance</span> — review needed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {(["starter", "pro", "enterprise"] as const).map((plan) => (
          <Card key={plan}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 capitalize">{plan}</p>
              <p className="text-3xl font-bold">{orgs.filter((o) => o.plan === plan).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All orgs table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Organisations ({orgs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="text-muted-foreground text-sm p-6">Loading...</p>}
          {orgs.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Name", "Slug", "Plan", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-5 py-3 font-medium">{org.name}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{org.slug}</td>
                    <td className="px-5 py-3"><PlanBadge plan={org.plan} /></td>
                    <td className="px-5 py-3"><StatusBadge status={org.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/orgs/${org.id}`}>View</Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/orgs/${org.id}/edit`}>Edit</Link>
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
    </div>
  )
}
