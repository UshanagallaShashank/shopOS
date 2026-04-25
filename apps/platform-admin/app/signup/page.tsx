"use client"
// Signup — calls backend /auth/signup, role decided by secret_key at this point only
// After this, role is fixed — no way to change it except admin approval
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

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords do not match"); return }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return }
    setLoading(true); setError("")

    // Single call to backend — it creates Supabase user + DB user with correct role
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        secret_key: secretKey || null,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.detail ?? "Signup failed")
      setLoading(false)
      return
    }

    const data = await res.json()
    console.log("[Signup] Received token from backend")

    // Store token in localStorage FIRST
    localStorage.setItem("shopos_token", data.access_token)
    console.log("[Signup] Token stored in localStorage")

    // Set cookie via Next.js API route
    try {
      await fetch("/auth/set-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.access_token, role: data.user?.role }),
      })
      console.log("[Signup] Cookie set successfully")
    } catch (err) {
      console.error("[Signup] Failed to set cookie:", err)
    }

    // Small delay to ensure localStorage is written
    await new Promise(resolve => setTimeout(resolve, 100))

    // Redirect to role-specific dashboard
    const dashboard = ROLE_DASHBOARD[data.user?.role] ?? "/dashboard"
    console.log("[Signup] Redirecting to:", dashboard)
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
            <CardTitle>Create account</CardTitle>
            <CardDescription>Get started with ShopOS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min. 6 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" placeholder="••••••••"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="secret">
                  Secret key <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="secret" type="password" placeholder="Leave blank for regular account"
                  value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Your role is set here and cannot be changed later without admin approval.
                </p>
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
