"use client"
import { useState } from "react"
import Link from "next/link"
import { Phone, Mail, ArrowLeft } from "lucide-react"
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

async function storeToken(token: string, role: string) {
  localStorage.setItem("shopos_token", token)
  try {
    await fetch("/auth/set-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, role }),
    })
  } catch {}
  await new Promise(r => setTimeout(r, 100))
  window.location.href = ROLE_DASHBOARD[role] ?? "/dashboard"
}

export default function LoginPage() {
  const [tab, setTab] = useState<"email" | "phone">("email")

  // Email/password state
  const [email, setEmail]     = useState("")
  const [password, setPassword] = useState("")

  // Phone OTP state
  const [phone, setPhone]     = useState("")
  const [otp, setOtp]         = useState("")
  const [otpSent, setOtpSent] = useState(false)

  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
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
    await storeToken(data.access_token, data.user?.role)
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, "")
    if (digits.length < 7) { setError("Enter a valid phone number"); return }
    setLoading(true); setError("")
    const res = await fetch(`${API}/auth/phone/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalisePhone(phone) }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.detail ?? "Could not send OTP")
      setLoading(false)
      return
    }
    setOtpSent(true)
    setLoading(false)
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 4) { setError("Enter the OTP from your SMS"); return }
    setLoading(true); setError("")
    const res = await fetch(`${API}/auth/phone/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalisePhone(phone), token: otp }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.detail ?? "Invalid or expired OTP")
      setLoading(false)
      return
    }
    const data = await res.json()
    await storeToken(data.access_token, data.user?.role)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Shop<span className="text-primary">OS</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Platform Admin</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access the platform dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tab selector */}
            <div className="flex rounded-lg bg-muted/40 p-1 gap-1">
              <button
                type="button"
                onClick={() => { setTab("email"); setError("") }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === "email"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />Email
              </button>
              <button
                type="button"
                onClick={() => { setTab("phone"); setError(""); setOtpSent(false) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === "phone"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone className="h-3.5 w-3.5" />Phone OTP
              </button>
            </div>

            {/* Email/password form */}
            {tab === "email" && (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && (
                  <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            )}

            {/* Phone OTP form */}
            {tab === "phone" && !otpSent && (
              <form onSubmit={handleSendOTP} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile number</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210"
                    value={phone} onChange={e => setPhone(e.target.value)} required />
                  <p className="text-[11px] text-muted-foreground">
                    We'll send a one-time password via SMS.
                  </p>
                </div>
                {error && (
                  <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending OTP…" : "Send OTP"}
                </Button>
              </form>
            )}

            {tab === "phone" && otpSent && (
              <form onSubmit={handleVerifyOTP} className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <button type="button" onClick={() => { setOtpSent(false); setOtp("") }}
                    className="hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  OTP sent to <strong className="text-foreground">{phone}</strong>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="otp">One-time password</Label>
                  <Input id="otp" type="text" inputMode="numeric" maxLength={6}
                    placeholder="123456" autoFocus
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} required />
                </div>
                {error && (
                  <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying…" : "Verify & Sign in"}
                </Button>
                <button type="button" onClick={handleSendOTP}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Resend OTP
                </button>
              </form>
            )}

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
