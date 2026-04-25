"use client"
// Users — full CRUD for all 4 roles. Platform admin can do everything.
// Orgs manager can assign/unassign users to orgs.
// Org admin can view users in their org.
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Users, Pencil, Trash2, UserPlus, X, Building2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleBadge } from "@/components/badges"
import type { User, UserRole, UserUpdate } from "@/lib/types"

const ALL_ROLES: UserRole[] = ["platform_admin", "orgs_manager", "org_admin", "end_user"]

// ── Edit User Modal ────────────────────────────────────────────────────────
function EditUserModal({
  user,
  orgs,
  adminRole,
  onClose,
}: {
  user: User
  orgs: { id: string; name: string }[]
  adminRole: UserRole
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [role, setRole] = useState<UserRole>(user.role)
  const [orgId, setOrgId] = useState(user.org_id ?? "")
  const [clearOrg, setClearOrg] = useState(false)
  const [error, setError] = useState("")

  const update = useMutation({
    mutationFn: (data: UserUpdate) => api.users.update(user.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  const canChangeRole = adminRole === "platform_admin" || adminRole === "orgs_manager"
  const canAssignOrg = adminRole !== "end_user"

  // Roles that the current admin can assign
  const assignableRoles: UserRole[] =
    adminRole === "platform_admin"
      ? ALL_ROLES
      : adminRole === "orgs_manager"
      ? ["orgs_manager", "org_admin", "end_user"]
      : ["end_user"]

  function handleSave() {
    const payload: UserUpdate = {}
    if (canChangeRole && role !== user.role) payload.role = role
    if (clearOrg) {
      payload.clear_org = true
    } else if (canAssignOrg && orgId && orgId !== user.org_id) {
      payload.org_id = orgId
    }
    if (Object.keys(payload).length === 0) { onClose(); return }
    update.mutate(payload)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="font-semibold">Edit User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* User info (read-only) */}
          <div className="bg-accent/30 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium">{user.email ?? "No email"}</p>
            <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 16)}…</p>
          </div>

          {/* Role selector */}
          {canChangeRole && (
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          )}

          {/* Org assignment */}
          {canAssignOrg && (
            <div className="space-y-1.5">
              <Label>Assign to Org</Label>
              <select
                value={clearOrg ? "" : orgId}
                onChange={(e) => {
                  setClearOrg(false)
                  setOrgId(e.target.value)
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— No org —</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              {user.org_id && (
                <button
                  type="button"
                  onClick={() => { setClearOrg(true); setOrgId("") }}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove from current org
                </button>
              )}
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <Button onClick={handleSave} disabled={update.isPending} className="flex-1">
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { shopUser } = useAuth()
  const qc = useQueryClient()
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const isPlatformAdmin = shopUser?.role === "platform_admin"
  const isOrgsManager = shopUser?.role === "orgs_manager"
  const isOrgAdmin = shopUser?.role === "org_admin"

  // Org admins only see their own org's users
  const orgIdFilter = isOrgAdmin ? shopUser?.org_id ?? undefined : undefined

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", orgIdFilter],
    queryFn: () => api.users.list(0, 200, orgIdFilter),
  })

  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.orgs.list(),
    enabled: isPlatformAdmin || isOrgsManager,
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.users.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  })

  // Build org name lookup
  const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]))

  // Filter
  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter
    const matchSearch =
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.id.includes(search)
    return matchRole && matchSearch
  })

  // Role counts for the filter pills
  const counts = ALL_ROLES.reduce(
    (acc, r) => ({ ...acc, [r]: users.filter((u) => u.role === r).length }),
    {} as Record<UserRole, number>
  )

  const pageTitle = isOrgAdmin ? "My Org's Users" : "All Users"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
            <p className="text-muted-foreground text-sm">{users.length} users</p>
          </div>
        </div>
      </div>

      {/* Role breakdown cards */}
      {(isPlatformAdmin || isOrgsManager) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(roleFilter === r ? "all" : r)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                roleFilter === r
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <p className="text-2xl font-bold">{counts[r]}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {r.replace(/_/g, " ")}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search by email or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {(isPlatformAdmin || isOrgsManager) && (
          <div className="flex gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant={roleFilter === "all" ? "default" : "outline"}
              onClick={() => setRoleFilter("all")}
            >
              All
            </Button>
            {ALL_ROLES.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={roleFilter === r ? "default" : "outline"}
                onClick={() => setRoleFilter(r)}
                className="capitalize"
              >
                {r.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="text-muted-foreground text-sm p-6">Loading…</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground text-sm p-6">No users found.</p>
          )}
          {filtered.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["User", "Role", "Org", "Joined", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{u.email ?? "—"}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {u.id.slice(0, 12)}…
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3">
                      {u.org_id ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {orgMap[u.org_id] ?? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {u.org_id.slice(0, 8)}…
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        {/* Edit: platform_admin, orgs_manager, org_admin can edit */}
                        {(isPlatformAdmin || isOrgsManager || isOrgAdmin) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingUser(u)}
                            title="Edit user"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {/* Delete: platform_admin only */}
                        {isPlatformAdmin && u.id !== shopUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Delete user "${u.email}"? This cannot be undone.`))
                                deleteUser.mutate(u.id)
                            }}
                            title="Delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Role guide */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Role Permissions Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium text-foreground">platform_admin</p>
            <p>Full access — manage all users, orgs, products, orders. Approve role requests.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">orgs_manager</p>
            <p>Manage all orgs and assign users to orgs. Cannot promote to platform_admin.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">org_admin</p>
            <p>Manage products and orders for their assigned org. View users in their org.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">end_user</p>
            <p>View their own orders. Can request role upgrade to orgs_manager.</p>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editingUser && shopUser && (
        <EditUserModal
          user={editingUser}
          orgs={orgs}
          adminRole={shopUser.role}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  )
}
