"use client"
// Edit org — pre-fills current values, PATCH on submit
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import type { OrgStatus, PlanType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EditOrgPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: org } = useQuery({ queryKey: ["orgs", id], queryFn: () => api.orgs.get(id) })

  const [name, setName] = useState("")
  const [status, setStatus] = useState<OrgStatus>("active")
  const [plan, setPlan] = useState<PlanType>("starter")

  // Pre-fill form once org data loads
  useEffect(() => {
    if (org) { setName(org.name); setStatus(org.status); setPlan(org.plan) }
  }, [org])

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: { name: string; status: OrgStatus; plan: PlanType }) =>
      api.orgs.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs"] })
      router.push(`/orgs/${id}`)
    },
  })

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <div className="max-w-md space-y-6">
      <Link href={`/orgs/${id}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to Org
      </Link>
      <Card>
        <CardHeader><CardTitle>Edit Org</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); mutate({ name, status, plan }) }}
            className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Shop Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as OrgStatus)} className={selectClass}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan">Plan</Label>
              <select id="plan" value={plan} onChange={(e) => setPlan(e.target.value as PlanType)} className={selectClass}>
                <option value="starter">Starter — ₹999/mo</option>
                <option value="pro">Pro — ₹2,499/mo</option>
                <option value="enterprise">Enterprise — ₹6,999/mo</option>
              </select>
            </div>
            {error && <p className="text-destructive text-sm">{error.message}</p>}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
