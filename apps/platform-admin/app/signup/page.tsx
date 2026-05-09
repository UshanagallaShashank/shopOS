"use client"
import { useState } from "react"
import Link from "next/link"
import { Phone } from "lucide-react"
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

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (raw.trim().startsWith("+")) return "+" + digits
  if (digits.length === 10) return "+91" + digits
  if (digits.length === 12 && digits.startsWith("91")) return "+" + digits
  if (digits.length === 11 && digits.startsWith("0")) return "+91" + digits.slice(1)
  return "+" + digits
}

export default function SignupPage() {
  const [email, setEmail]       = useState("")
  const [phone, setPhone]       = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  function validatePhone(raw: string): string | null {
    const digits = raw.replace(/\D/g, "")
    if (digits.length < 7) return "Enter a valid phone number"
    return null
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords do not match"); return }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return }
    const phoneErr = validatePhone(phone)
    if (phoneErr) { setError(phoneErr); return }

    setLoading(true); setError("")

    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        phone: normalisePhone(phone),
        secret_key: secretKey || null,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.detail ?? "Signup failed")
      setLoading(false)
      return
    }

    const data = await res.json()
    localStorage.setItem("shopos_token", data.access_token)

    try {
      await fetch("/auth/set-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.access_token, role: data.user?.role }),
      })
    } catch {}

    await new Promise(r => setTimeout(r, 100))
    window.location.href = ROLE_DASHBOARD[data.user?.role] ?? "/dashboard"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Shop<span className="text-primary">OS</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Create your account</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Get started with ShopOS</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              {/* Phone — mandatory */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Mobile number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Used for order updates via SMS. Indian numbers: just enter 10 digits.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="secret">
                  Secret key <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="secret" type="password" placeholder="Leave blank for regular account"
                  value={secretKey} onChange={e => setSecretKey(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Your role is set here and cannot be changed without admin approval.
                </p>
              </div>

              {error && (
                <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
