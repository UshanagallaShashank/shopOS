"use client"
// Users — full CRUD for all 4 roles. Platform admin can do everything.
// Orgs manager can assign/unassign users to orgs.
// Org admin can view users in their org.
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Users, Pencil, Trash2, X, Building2, Check, UserPlus } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleBadge } from "@/components/badges"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { Org, User, UserCreate, UserRole, UserUpdate } from "@/lib/types"

const ALL_ROLES: UserRole[] = ["platform_admin", "orgs_manager", "org_admin", "end_user"]

const ROLE_DESCRIPTIONS: Record<UserRole, { title: string; desc: string; fields: string[] }> = {
  platform_admin: {
    title: "Platform Admin",
    desc: "Full access to all orgs, users, and platform settings.",
    fields: ["email"],
  },
  orgs_manager: {
    title: "Orgs Manager",
    desc: "Can manage orgs and assign users. Cannot promote to platform_admin.",
    fields: ["email"],
  },
  org_admin: {
    title: "Org Admin",
    desc: "Manages products and orders for a single org. Must be assigned an org.",
    fields: ["email", "phone", "org_id"],
  },
  end_user: {
    title: "End User",
    desc: "Can browse shops and place orders. Needs org access grants to shop.",
    fields: ["email", "phone"],
  },
}

// ── Create User Drawer ─────────────────────────────────────────────────────
function CreateUserDrawer({
  orgs,
  adminRole,
  onClose,
}: {
  orgs: Org[]
  adminRole: UserRole
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [role, setRole] = useState<UserRole>("end_user")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [orgId, setOrgId] = useState("")
  const [error, setError] = useState("")

  const assignableRoles: UserRole[] =
    adminRole === "platform_admin"
      ? ALL_ROLES
      : adminRole === "orgs_manager"
      ? ["orgs_manager", "org_admin", "end_user"]
      : ["end_user"]

  const meta = ROLE_DESCRIPTIONS[role]
  const needsOrg = meta.fields.includes("org_id")
  const needsPhone = meta.fields.includes("phone")

  const create = useMutation({
    mutationFn: (data: UserCreate) => api.users.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError("Email is required"); return }
    if (needsOrg && !orgId) { setError("Org assignment is required for Org Admin"); return }
    create.mutate({
      firebase_uid: crypto.randomUUID(),
      email,
      phone: phone || undefined,
      role,
      org_id: orgId || undefined,
    })
  }

  const selectCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Create User</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Role picker — cards */}
          <div className="space-y-2">
            <Label>Role <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {assignableRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setOrgId("") }}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    role === r
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <RoleBadge role={r} />
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {ROLE_DESCRIPTIONS[r].desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic fields based on role */}
          <div className="space-y-3 rounded-xl border border-border bg-accent/10 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {meta.title} Details
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="cu-email">Email Address <span className="text-destructive">*</span></Label>
              <Input id="cu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com" required />
            </div>

            {needsPhone && (
              <div className="space-y-1.5">
                <Label htmlFor="cu-phone">Phone Number</Label>
                <Input id="cu-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210" />
              </div>
            )}

            {needsOrg && (
              <div className="space-y-1.5">
                <Label htmlFor="cu-org">
                  Assign to Org <span className="text-destructive">*</span>
                </Label>
                <select id="cu-org" value={orgId} onChange={(e) => setOrgId(e.target.value)} className={selectCls} required>
                  <option value="">— Select an org —</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Org admin will manage this org's products & orders.</p>
              </div>
            )}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={create.isPending} className="flex-1">
              {create.isPending ? "Creating…" : "Create User"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit User Modal ────────────────────────────────────────────────────────
function EditUserModal({
  user,
  orgs,
  adminRole,
  onClose,
}: {
  user: User
  orgs: Org[]
  adminRole: UserRole
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [role, setRole] = useState<UserRole>(user.role)
  const [orgId, setOrgId] = useState(user.org_id ?? "")
  const [clearOrg, setClearOrg] = useState(false)
  // Multi-org access (for ordering)
  const [selectedOrgIds, setSelectedOrgIds] = useState<Set<string>>(
    new Set(user.accessible_org_ids ?? [])
  )
  const [activeTab, setActiveTab] = useState<"role" | "access">("role")
  const [error, setError] = useState("")

  const update = useMutation({
    mutationFn: (data: UserUpdate) => api.users.update(user.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  const setOrgAccess = useMutation({
    mutationFn: (org_ids: string[]) => api.users.setOrgAccess(user.id, org_ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  const canChangeRole = adminRole === "platform_admin" || adminRole === "orgs_manager"
  const canAssignOrg = adminRole !== "end_user"
  const canManageAccess = adminRole === "platform_admin" || adminRole === "orgs_manager"

  const assignableRoles: UserRole[] =
    adminRole === "platform_admin"
      ? ALL_ROLES
      : adminRole === "orgs_manager"
      ? ["orgs_manager", "org_admin", "end_user"]
      : ["end_user"]

  function toggleOrg(id: string) {
    setSelectedOrgIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSaveRole() {
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

  function handleSaveAccess() {
    setOrgAccess.mutate([...selectedOrgIds])
  }

  const isPending = update.isPending || setOrgAccess.isPending

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-border">
          <div>
            <h2 className="font-semibold">Edit User</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email ?? user.id.slice(0, 16) + "…"}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("role")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "role"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Role &amp; Primary Org
          </button>
          {canManageAccess && (
            <button
              onClick={() => setActiveTab("access")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "access"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Org Access
              {selectedOrgIds.size > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {selectedOrgIds.size}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab: Role & Primary Org */}
        {activeTab === "role" && (
          <div className="p-5 space-y-4">
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

            {canAssignOrg && (
              <div className="space-y-1.5">
                <Label>Primary Org</Label>
                <p className="text-xs text-muted-foreground">
                  The org this user manages (org_admin) or belongs to as their home org.
                </p>
                <select
                  value={clearOrg ? "" : orgId}
                  onChange={(e) => { setClearOrg(false); setOrgId(e.target.value) }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— No primary org —</option>
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
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveRole} disabled={isPending} className="flex-1">
                {update.isPending ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Tab: Org Access */}
        {activeTab === "access" && canManageAccess && (
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Orgs this user can order from</Label>
              <p className="text-xs text-muted-foreground">
                Select every org the user should be able to browse and place orders in.
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border border-border p-2">
              {orgs.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No orgs available.</p>
              )}
              {orgs.map((o) => {
                const selected = selectedOrgIds.has(o.id)
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggleOrg(o.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-accent/50 border border-transparent"
                    }`}
                  >
                    <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      selected ? "bg-primary border-primary" : "border-input bg-background"
                    }`}>
                      {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{o.slug}</p>
                    </div>
                    {selected && (
                      <span className="text-xs text-primary font-medium shrink-0">Access granted</span>
                    )}
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedOrgIds.size} org{selectedOrgIds.size !== 1 ? "s" : ""} selected
            </p>

            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveAccess} disabled={isPending} className="flex-1">
                {setOrgAccess.isPending ? "Saving…" : "Save Access"}
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        )}
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ user: User } | null>(null)

  const isPlatformAdmin = shopUser?.role === "platform_admin"
  const isOrgsManager = shopUser?.role === "orgs_manager"
  const isOrgAdmin = shopUser?.role === "org_admin"

  // Org admins only see their own org's users
  const orgIdFilter = isOrgAdmin && shopUser?.org_id ? shopUser.org_id : undefined

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", orgIdFilter],
    queryFn: () => api.users.list(0, 200, orgIdFilter),
  })

  const { data: orgs = [] } = useQuery<Org[]>({
    queryKey: ["orgs"],
    queryFn: () => api.orgs.list(0, 200),
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
                  {["User", "Role", "Primary Org", "Org Access", "Joined", ""].map((h) => (
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
                    <td className="px-5 py-3">
                      {u.accessible_org_ids?.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Building2 className="h-3 w-3" />
                          {u.accessible_org_ids.length} org{u.accessible_org_ids.length !== 1 ? "s" : ""}
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
                            onClick={() => setDeleteConfirm({ user: u })}
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

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            deleteUser.mutate(deleteConfirm.user.id)
            setDeleteConfirm(null)
          }}
          title="Delete User"
          description={`Are you sure you want to delete "${deleteConfirm.user.email}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="destructive"
          loading={deleteUser.isPending}
        />
      )}
    </div>
  )
}
