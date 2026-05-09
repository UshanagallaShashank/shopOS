"use client"
import { useState } from "react"
import {
  Settings, Bell, Shield, User, Building2, Palette,
  Globe, Lock, Eye, EyeOff, Save, CheckCircle2,
  Smartphone, Mail, Moon, Sun, Monitor, Phone, AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Section = "profile" | "notifications" | "security" | "appearance" | "store"

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  )
}

function SectionNav({ active, onChange, role }: { active: Section; onChange: (s: Section) => void; role: string }) {
  const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    ...(role === "org_admin" ? [{ id: "store" as Section, label: "Store", icon: Building2 }] : []),
  ]
  return (
    <div className="flex flex-col gap-0.5">
      {sections.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
            active === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
          }`}>
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const { shopUser, updatePhone } = useAuth()
  const role = shopUser?.role ?? "end_user"
  const [section, setSection] = useState<Section>("profile")
  const [saved, setSaved] = useState(false)
  const [phoneValue, setPhoneValue] = useState(shopUser?.phone ?? "")
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Notification toggles
  const [notifs, setNotifs] = useState({
    orderUpdates: true, lowStock: true, newReviews: true,
    weeklyReport: false, marketing: false, smsAlerts: false,
  })
  // Appearance
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark")

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handlePhoneSave() {
    const digits = phoneValue.replace(/\D/g, "")
    if (digits.length < 7) { setPhoneError("Enter a valid phone number"); return }
    setPhoneError("")
    setPhoneSaving(true)
    try {
      await updatePhone(phoneValue)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setPhoneError("Failed to save phone number")
    } finally {
      setPhoneSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6 flex-col sm:flex-row">
        {/* Left nav */}
        <div className="sm:w-48 shrink-0">
          <SectionNav active={section} onChange={setSection} role={role} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Profile */}
          {section === "profile" && (
            <div className="space-y-4">
              {/* Phone missing warning */}
              {!shopUser?.phone && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
                  <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-400">Phone number missing</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add your mobile number to receive order updates via SMS.
                    </p>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />Profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/15 border-2 border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                      {shopUser?.email?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <p className="font-semibold">{shopUser?.email ?? "—"}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{role.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                    <Input value={shopUser?.email ?? ""} readOnly className="bg-muted/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Display Name</label>
                    <Input placeholder={shopUser?.email?.split("@")[0] ?? "Your name"} />
                  </div>
                  <Button onClick={handleSave} className="gap-2">
                    {saved ? <><CheckCircle2 className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save Changes</>}
                  </Button>
                </CardContent>
              </Card>

              {/* Phone card — always visible, highlighted if missing */}
              <Card className={!shopUser?.phone ? "border-orange-500/30" : ""}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Mobile Number
                    {!shopUser?.phone && (
                      <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400">Required for SMS</span>
                    )}
                    {shopUser?.phone && (
                      <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />Verified
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phoneValue}
                        onChange={e => setPhoneValue(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Used to send order updates and important alerts via SMS.
                      Indian numbers: just enter 10 digits.
                    </p>
                    {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                  </div>
                  <Button onClick={handlePhoneSave} disabled={phoneSaving} className="gap-2">
                    {phoneSaving ? (
                      <><span className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Saving…</>
                    ) : saved ? (
                      <><CheckCircle2 className="h-4 w-4" />Saved!</>
                    ) : (
                      <><Phone className="h-4 w-4" />{shopUser?.phone ? "Update Number" : "Add Number"}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications */}
          {section === "notifications" && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</CardTitle></CardHeader>
              <CardContent className="divide-y divide-border">
                <Toggle checked={notifs.orderUpdates} label="Order status updates"
                  description="Get notified when your orders are confirmed, shipped, and delivered"
                  onChange={(v) => setNotifs(p => ({ ...p, orderUpdates: v }))} />
                {(role === "org_admin" || role === "platform_admin") && (
                  <Toggle checked={notifs.lowStock} label="Low stock alerts"
                    description="Alert when a product drops below 5 units"
                    onChange={(v) => setNotifs(p => ({ ...p, lowStock: v }))} />
                )}
                {role === "org_admin" && (
                  <Toggle checked={notifs.newReviews} label="New product reviews"
                    description="Notify when a customer leaves a review"
                    onChange={(v) => setNotifs(p => ({ ...p, newReviews: v }))} />
                )}
                <Toggle checked={notifs.smsAlerts} label="SMS alerts"
                  description="Receive critical updates via SMS (requires phone number)"
                  onChange={(v) => setNotifs(p => ({ ...p, smsAlerts: v }))} />
                <Toggle checked={notifs.weeklyReport} label="Weekly summary email"
                  description="Weekly digest of activity and performance"
                  onChange={(v) => setNotifs(p => ({ ...p, weeklyReport: v }))} />
                <Toggle checked={notifs.marketing} label="Product updates & tips"
                  description="Occasional emails about new ShopOS features"
                  onChange={(v) => setNotifs(p => ({ ...p, marketing: v }))} />
                <div className="pt-4">
                  <Button onClick={handleSave} className="gap-2">
                    {saved ? <><CheckCircle2 className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save Preferences</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security */}
          {section === "security" && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Security</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Change Password</p>
                  <div className="space-y-2">
                    <Input type="password" placeholder="Current password" />
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="New password" />
                      <button onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button variant="outline" size="sm">Update Password</Button>
                </div>
                <div className="border-t border-border pt-5 space-y-3">
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                    <Smartphone className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Authenticator App</p>
                      <p className="text-xs text-muted-foreground">Not configured</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">Enable</Button>
                  </div>
                </div>
                <div className="border-t border-border pt-5 space-y-3">
                  <p className="text-sm font-medium">Active Sessions</p>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                    <Globe className="h-5 w-5 text-green-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Current session</p>
                      <p className="text-xs text-muted-foreground">Active now · This device</p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance */}
          {section === "appearance" && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" />Appearance</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "light", label: "Light", icon: Sun },
                      { id: "system", label: "System", icon: Monitor },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button key={id} onClick={() => setTheme(id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          theme === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}>
                        <Icon className={`h-5 w-5 ${theme === id ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-medium">Language & Region</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Language</label>
                      <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                        <option>English (India)</option>
                        <option>Hindi</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Currency</label>
                      <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm">
                        <option>INR (₹)</option>
                        <option>USD ($)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSave} className="gap-2">
                  {saved ? <><CheckCircle2 className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save Appearance</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Store (org_admin only) */}
          {section === "store" && role === "org_admin" && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />Store Settings</CardTitle></CardHeader>
              <CardContent className="divide-y divide-border">
                <Toggle checked={true} label="Store is public"
                  description="Your store is visible to customers with access" onChange={() => {}} />
                <Toggle checked={false} label="Maintenance mode"
                  description="Temporarily hide your store while you make changes" onChange={() => {}} />
                <Toggle checked={true} label="Accept new orders"
                  description="Turn off to pause orders without closing the store" onChange={() => {}} />
                <Toggle checked={false} label="Show out-of-stock products"
                  description="Display products even when they have 0 inventory" onChange={() => {}} />
                <div className="pt-4">
                  <Button onClick={handleSave} className="gap-2">
                    {saved ? <><CheckCircle2 className="h-4 w-4" />Saved!</> : <><Save className="h-4 w-4" />Save Store Settings</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
