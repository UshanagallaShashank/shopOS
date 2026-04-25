"use client"
// Org overview page — all orgs with plan, status, quick actions
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlanBadge, StatusBadge } from "@/components/badges"

export default function OrgPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.orgs.list(),
  })

  const deleteOrg = useMutation({
    mutationFn: (id: string) => api.orgs.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orgs"] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Organisations</h1>
            <p className="text-muted-foreground text-sm">{orgs.length} orgs on the platform</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/orgs/new"><Plus className="h-4 w-4 mr-1" />New Org</Link>
        </Button>
      </div>

      {/* Org cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading && <p className="text-muted-foreground text-sm col-span-3">Loading...</p>}
        {orgs.map((org) => (
          <Card key={org.id} className="hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => router.push(`/orgs/${org.id}`)}>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{org.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{org.slug}.shopOS.in</p>
                </div>
                <StatusBadge status={org.status} />
              </div>
              <div className="flex items-center justify-between">
                <PlanBadge plan={org.plan} />
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm"
                    onClick={(e) => { e.stopPropagation(); router.push(`/orgs/${org.id}`) }}>
                    View
                  </Button>
                  <Button variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${org.name}"?`)) deleteOrg.mutate(org.id)
                    }}>
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
