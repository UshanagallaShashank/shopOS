"use client"
// Users page — all users across the platform, filterable by role
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/badges"
import type { UserRole } from "@/lib/types"

// All role options + "all" for the filter buttons
const ROLES: Array<UserRole | "all"> = ["all", "platform_admin", "orgs_manager", "org_admin", "end_user"]

export default function UsersPage() {
  const [filter, setFilter] = useState<UserRole | "all">("all")

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
  })

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm">{users.length} total users</p>
        </div>
      </div>

      {/* Role filter pills */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((role) => (
          <Button key={role} size="sm"
            variant={filter === role ? "default" : "outline"}
            onClick={() => setFilter(role)}
            className="capitalize">
            {role.replace("_", " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="text-muted-foreground text-sm p-6">Loading...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-muted-foreground text-sm p-6">No users found.</p>
          )}
          {filtered.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Email / Phone", "Role", "Org", "Joined"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{u.email ?? "—"}</p>
                      {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{u.org_id ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-IN")}
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
