"use client"
// Admin page — lists all platform_admin and orgs_manager users
import { useQuery } from "@tanstack/react-query"
import { ShieldCheck } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleBadge } from "@/components/badges"

export default function AdminPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
  })

  // Only show admin-level roles on this page
  const admins = users.filter(
    (u) => u.role === "platform_admin" || u.role === "orgs_manager"
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Admins</h1>
          <p className="text-muted-foreground text-sm">{admins.length} admin users</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform & Org Managers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="text-muted-foreground text-sm p-6">Loading...</p>}
          {!isLoading && admins.length === 0 && (
            <p className="text-muted-foreground text-sm p-6">No admin users found.</p>
          )}
          {admins.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Email", "Role", "Org", "Joined"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-muted-foreground uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admins.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-5 py-3 font-medium">{u.email ?? "—"}</td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{u.org_id ?? "All orgs"}</td>
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
