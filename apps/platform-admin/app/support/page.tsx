"use client"
import { useState } from "react"
import {
  MessageSquare, Send, CheckCircle2, Mail,
  Phone, Clock, AlertCircle, HelpCircle,
  ChevronRight, Zap, Shield, Package,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const CATEGORIES = [
  { id: "order",   label: "Order Issue",       icon: Package,      color: "text-blue-400",    bg: "bg-blue-500/10" },
  { id: "account", label: "Account Help",       icon: Shield,       color: "text-violet-400",  bg: "bg-violet-500/10" },
  { id: "payment", label: "Payment Problem",    icon: AlertCircle,  color: "text-orange-400",  bg: "bg-orange-500/10" },
  { id: "other",   label: "Something Else",     icon: HelpCircle,   color: "text-muted-foreground", bg: "bg-muted" },
]

export default function SupportPage() {
  const { shopUser } = useAuth()
  const [category, setCategory] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim() || !category) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1200)
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-4 py-16">
        <div className="h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Request Submitted</h2>
          <p className="text-muted-foreground text-sm mt-1">
            We've received your message and will respond to <span className="font-medium text-foreground">{shopUser?.email}</span> within a few hours.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); setCategory("") }} variant="outline">
            Submit Another
          </Button>
          <Link href="/help"><Button variant="outline">Back to Help</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 py-2">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <MessageSquare className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Contact Support</h1>
          <p className="text-muted-foreground text-sm">Tell us what's wrong — we'll sort it out</p>
        </div>
      </div>

      {/* Response time banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-sm">
        <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
        <span className="text-emerald-400 font-medium">Avg response time: 2–4 hours</span>
        <span className="text-muted-foreground">· Mon–Sat, 9am–7pm IST</span>
      </div>

      {/* Category picker */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">What do you need help with?</p>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  category === cat.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 bg-card"
                }`}>
                <div className={`h-9 w-9 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                </div>
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="h-4 w-4" /> Your Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Your Email</label>
              <Input value={shopUser?.email ?? ""} readOnly className="bg-muted/50 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Subject <span className="text-destructive">*</span></label>
              <Input
                placeholder="Briefly describe your issue"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Details <span className="text-destructive">*</span></label>
              <textarea
                className="w-full min-h-[120px] rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 placeholder:text-muted-foreground"
                placeholder="Describe what happened, what you expected, and any relevant order or product details…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={1000}
              />
              <p className="text-[11px] text-muted-foreground text-right">{message.length}/1000</p>
            </div>
            <Button
              type="submit"
              disabled={!category || !subject.trim() || !message.trim() || loading}
              className="gap-2 w-full sm:w-auto"
            >
              {loading ? (
                <><span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Sending…</>
              ) : (
                <><Send className="h-3.5 w-3.5" />Send Message</>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Alternative contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Email Us</p>
            <p className="text-xs text-muted-foreground">support@shopos.dev</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Quick Answers</p>
            <Link href="/help" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              Browse FAQ <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
