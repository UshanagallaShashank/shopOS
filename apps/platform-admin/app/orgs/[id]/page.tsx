"use client"
// Org detail — info, products, and users assigned to this org
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Pencil, Trash2, Plus, Users, Package, X } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { PlanBadge, StatusBadge, RoleBadge } from "@/components/badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserUpdate } from "@/lib/types"

type Tab = "products" | "users" | "invites"

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { shopUser } = useAuth()
  const [tab, setTab] = useState<Tab>("products")

  const isPlatformAdmin = shopUser?.role === "platform_admin"
  const isOrgsManager = shopUser?.role === "orgs_manager"
  const canManageOrg = isPlatformAdmin || isOrgsManager

  const { data: org, isLoading } = useQuery({
    queryKey: ["orgs", id],
    queryFn: () => api.orgs.get(id),
  })

  const { data: products = [] } = useQuery({
    queryKey: ["products", id],
    queryFn: () => api.products.list(id),
    enabled: !!id,
  })

  // Users assigned to this org
  const { data: orgUsers = [] } = useQuery({
    queryKey: ["users", id],
    queryFn: () => api.users.list(0, 200, id),
    enabled: !!id && tab === "users",
  })

  // All users (for the assign dropdown — only load when needed)
  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list(0, 200),
    enabled: canManageOrg && tab === "users",
  })

  const deleteOrg = useMutation({
    mutationFn: () => api.orgs.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orgs"] }); router.push("/orgs") },
  })

  const deleteProduct = useMutation({
    mutationFn: (pid: string) => api.products.delete(pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", id] }),
  })

  const updateUser = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdate }) =>
      api.users.update(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", id] })
      qc.invalidateQueries({ queryKey: ["users"] })
    },
  })

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>
  if (!org) return <p className="text-destructive text-sm">Org not found.</p>

  // Users not yet in this org (for assign dropdown)
  const unassignedUsers = allUsers.filter(
    (u) => u.org_id !== id && u.role !== "platform_admin" && u.role !== "orgs_manager"
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <Link href="/orgs" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← All Orgs
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{org.slug}.shopOS.in</p>
          </div>
          {isPlatformAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/orgs/${id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { if (confirm(`Delete "${org.name}"?`)) deleteOrg.mutate() }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Plan</p>
          <PlanBadge plan={org.plan} />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Status</p>
          <StatusBadge status={org.status} />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Created</p>
          <p className="text-sm">{new Date(org.created_at).toLocaleDateString("en-IN")}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["products", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "products" ? <Package className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
            {t}
            <span className="ml-1 text-xs text-muted-foreground">
              ({t === "products" ? products.length : orgUsers.length})
            </span>
          </button>
        ))}
      </div>

      {/* Products tab */}
      {tab === "products" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Products ({products.length})
            </h2>
            <Button size="sm" asChild>
              <Link href={`/orgs/${id}/products/new`}><Plus className="h-3.5 w-3.5 mr-1" />Add Product</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {products.length === 0 ? (
                <p className="text-muted-foreground p-5 text-sm">No products yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      {["Name", "Price", "Stock", "Category", "Active", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3">₹{Number(p.price).toLocaleString("en-IN")}</td>
                        <td className={`px-4 py-3 ${p.stock < 5 ? "text-yellow-400 font-medium" : ""}`}>{p.stock}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.category ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={p.is_active ? "text-green-400" : "text-muted-foreground"}>
                            {p.is_active ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/orgs/${id}/products/${p.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteProduct.mutate(p.id) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="space-y-4">
          {/* Assign user to this org */}
          {canManageOrg && unassignedUsers.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Assign user to this org</p>
                <div className="flex gap-2">
                  <select
                    id="assign-user-select"
                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    defaultValue=""
                  >
                    <option value="">Select a user…</option>
                    {unassignedUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email ?? u.id.slice(0, 12)} — {u.role.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={() => {
                      const sel = document.getElementById("assign-user-select") as HTMLSelectElement
                      if (!sel.value) return
                      updateUser.mutate({ userId: sel.value, data: { org_id: id } })
                      sel.value = ""
                    }}
                    disabled={updateUser.isPending}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />Assign
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users in this org */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Users in this org ({orgUsers.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {orgUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm p-5">No users assigned to this org.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      {["User", "Role", "Joined", ""].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orgUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium">{u.email ?? "—"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 12)}…</p>
                        </td>
                        <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-3">
                          {canManageOrg && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              title="Remove from org"
                              onClick={() => {
                                if (confirm(`Remove "${u.email}" from this org?`))
                                  updateUser.mutate({ userId: u.id, data: { clear_org: true } })
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
