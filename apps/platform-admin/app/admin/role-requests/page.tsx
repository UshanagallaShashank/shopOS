"use client"
// Role Requests — platform_admin reviews pending orgs_manager requests
import { useState } from "react"
import { getToken } from "@/lib/token"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface RoleRequest {
  id: string
  user_id: string
  requested_role: string
  reason: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export default function RoleRequestsPage() {
  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const token = getToken()
    if (!token) { setLoading(false); return }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/role-requests?status_filter=pending`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.ok) { setRequests(await res.json()); setLoaded(true) }
    setLoading(false)
  }

  async function review(id: string, status: "approved" | "rejected") {
    const token = getToken()
    if (!token) return
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/role-requests/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })
    // Remove from list after review
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Approve or reject orgs_manager requests
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Load Requests"}
        </Button>
      </div>

      {loaded && requests.length === 0 && (
        <p className="text-muted-foreground text-sm">No pending requests.</p>
      )}

      <div className="space-y-3">
        {requests.map((req) => (
          <Card key={req.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium">
                  User: <span className="font-mono text-xs text-muted-foreground">{req.user_id.slice(0, 8)}…</span>
                </CardTitle>
                <Badge variant="warning">pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Requested role</p>
                <p className="text-sm font-medium mt-0.5">{req.requested_role}</p>
              </div>
              {req.reason && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Reason</p>
                  <p className="text-sm mt-0.5">{req.reason}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted {new Date(req.created_at).toLocaleDateString("en-IN")}
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => review(req.id, "approved")}>
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => review(req.id, "rejected")}>
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
