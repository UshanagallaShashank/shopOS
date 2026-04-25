"use client"
// Login — calls backend /auth/login, sets token cookie, redirects to role dashboard
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

const ROLE_DASHBOARD: Record<string, string> = {
  platform_admin: "/dashboard",
  orgs_manager:   "/orgs-manager",
  org_admin:      "/org-admin",
  end_user:       "/end-user",
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.detail ?? "Invalid email or password")
      setLoading(false)
      return
    }

    const data = await res.json()
    console.log("[Login] Received token from backend")

    // Store token in localStorage FIRST
    localStorage.setItem("shopos_token", data.access_token)
    console.log("[Login] Token stored in localStorage")

    // Set cookie via Next.js API route
    try {
      await fetch("/auth/set-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.access_token, role: data.user?.role }),
      })
      console.log("[Login] Cookie set successfully")
    } catch (err) {
      console.error("[Login] Failed to set cookie:", err)
    }

    // Small delay to ensure localStorage is written
    await new Promise(resolve => setTimeout(resolve, 100))

    // Redirect to role-specific dashboard
    const dashboard = ROLE_DASHBOARD[data.user?.role] ?? "/dashboard"
    console.log("[Login] Redirecting to:", dashboard)
    window.location.href = dashboard
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Shop<span className="text-primary">OS</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Platform Admin</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access the platform dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="admin@shopos.in"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
