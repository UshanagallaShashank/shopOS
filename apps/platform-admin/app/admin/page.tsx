"use client"
// Admin page — platform_admin and orgs_manager users, with role management
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ShieldCheck, Users, ClipboardList } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/badges"

export default function AdminPage() {
  const { shopUser } = useAuth()
  const qc = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
  })

  const updateUser = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.users.update(id, { role: role as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  })

  const admins = users.filter(
    (u) => u.role === "platform_admin" || u.role === "orgs_manager"
  )
  const endUsers = users.filter((u) => u.role === "end_user")
  const orgAdmins = users.filter((u) => u.role === "org_admin")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage platform-level access</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/role-requests">
            <ClipboardList className="h-4 w-4 mr-1.5" />Role Requests
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Platform Admins", value: users.filter((u) => u.role === "platform_admin").length, color: "text-primary" },
          { label: "Orgs Managers", value: users.filter((u) => u.role === "orgs_manager").length, color: "text-blue-400" },
          { label: "Org Admins", value: orgAdmins.length, color: "text-purple-400" },
          { label: "End Users", value: endUsers.length, color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin users table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Platform & Org Managers ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="text-muted-foreground text-sm p-6">Loading…</p>}
          {!isLoading && admins.length === 0 && (
            <p className="text-muted-foreground text-sm p-6">No admin users found.</p>
          )}
          {admins.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Email", "Role", "Org", "Joined", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admins.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-5 py-3 font-medium">{u.email ?? "—"}</td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{u.org_id ?? "All orgs"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3">
                      {/* Don't allow demoting yourself */}
                      {u.id !== shopUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive text-xs"
                          disabled={updateUser.isPending}
                          onClick={() => {
                            if (confirm(`Demote "${u.email}" to end_user?`))
                              updateUser.mutate({ id: u.id, role: "end_user" })
                          }}
                        >
                          Demote
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

      {/* How to create each role — guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            How to Create Each Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <RoleBadge role="platform_admin" />
              </div>
              <p className="text-muted-foreground text-xs">
                Sign up at <code className="bg-accent px-1 rounded">/signup</code> with the platform admin secret key.
                Or promote an existing user via the Users page.
              </p>
              <p className="text-xs font-mono bg-accent/50 rounded p-2 text-muted-foreground">
                Secret key: set in <code>PLATFORM_ADMIN_SECRET</code> env var
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <RoleBadge role="orgs_manager" />
              </div>
              <p className="text-muted-foreground text-xs">
                Sign up normally (end_user), then submit a role request from the dashboard.
                Platform admin approves it here. Or promote directly via Users page.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <RoleBadge role="org_admin" />
              </div>
              <p className="text-muted-foreground text-xs">
                Sign up at <code className="bg-accent px-1 rounded">/signup</code> with the org admin secret key
                and provide an <code className="bg-accent px-1 rounded">org_id</code>.
                Or assign an existing user to an org via the Orgs page → Users tab.
              </p>
              <p className="text-xs font-mono bg-accent/50 rounded p-2 text-muted-foreground">
                Secret key: set in <code>ORG_ADMIN_SECRET</code> env var
              </p>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <RoleBadge role="end_user" />
              </div>
              <p className="text-muted-foreground text-xs">
                Sign up at <code className="bg-accent px-1 rounded">/signup</code> with no secret key.
                Default role for all new registrations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
