"use client"
// Create org form — slug auto-generated from name, mirrors backend validator
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import type { PlanType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewOrgPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [plan, setPlan] = useState<PlanType>("starter")

  const { mutate, isPending, error } = useMutation({
    mutationFn: api.orgs.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs"] })
      router.push("/orgs")
    },
  })

  function handleName(v: string) {
    setName(v)
    // Auto-generate URL-safe slug — matches the backend slug_lowercase validator
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
  }

  return (
    <div className="max-w-md space-y-6">
      <Link href="/orgs" className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Org</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); mutate({ name, slug, plan }) }}
            className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="name">Shop Name</Label>
              <Input id="name" value={name} onChange={(e) => handleName(e.target.value)}
                placeholder="Meena Boutique" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">URL Slug</Label>
              {/* Prefix + input side by side */}
              <div className="flex items-center rounded-md border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                <span className="px-3 text-sm text-muted-foreground border-r border-input bg-muted/30 h-10 flex items-center shrink-0">
                  shopOS.in/
                </span>
                <input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="meena-boutique"
                  required
                  className="flex-1 bg-transparent px-3 h-10 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan">Plan</Label>
              {/* Native select styled to match dark theme */}
              <select
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="starter">Starter — ₹999/mo · 50 products</option>
                <option value="pro">Pro — ₹2,499/mo · 500 products</option>
                <option value="enterprise">Enterprise — ₹6,999/mo · Unlimited</option>
              </select>
            </div>

            {error && <p className="text-destructive text-sm">{error.message}</p>}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creating..." : "Create Org"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
