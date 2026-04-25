"use client"
// Role Request — any logged-in user can request orgs_manager promotion
import { useState } from "react"
import { getToken } from "@/lib/token"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RoleRequestPage() {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")

    const token = getToken()
    if (!token) { setError("Not logged in"); setLoading(false); return }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/role-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.detail ?? "Something went wrong")
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md space-y-6">
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <p className="font-semibold">Request submitted</p>
            <p className="text-sm text-muted-foreground">
              A platform admin will review your request. You&apos;ll be notified when it&apos;s approved.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request Role Upgrade</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Request to become an <strong>Orgs Manager</strong> — a platform admin will review it.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orgs Manager</CardTitle>
          <CardDescription>
            Can create and manage organisations across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reason">Why do you need this role?</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain your use case..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
