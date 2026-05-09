"use client"
import { useState } from "react"
import {
  HelpCircle, Search, ChevronDown, ChevronUp,
  ShoppingCart, Package, Store, User, MessageSquare,
  BookOpen, Video, Mail, ExternalLink,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const FAQS = [
  {
    category: "Orders",
    icon: ShoppingCart,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    items: [
      { q: "How do I track my order?", a: "Go to My Orders page. Each order shows its current status — Confirmed, Shipped, Out for Delivery, or Delivered. You'll also see tracking updates as the order progresses." },
      { q: "Can I cancel my order?", a: "You can cancel an order while it is still in Pending or Confirmed status. Once shipped, cancellation is not possible. Go to My Orders and look for the cancel option." },
      { q: "How long does delivery take?", a: "Delivery times vary by store. Each product page shows the estimated delivery window. Most orders are delivered within 3–7 business days." },
      { q: "What if I receive a wrong or damaged item?", a: "Contact the store directly via their contact details on the shop page, or reach out to our support team through the Contact Support option." },
    ],
  },
  {
    category: "Account & Shops",
    icon: User,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    items: [
      { q: "How do I access a shop?", a: "Shops are invitation-based. An org admin can add you to their shop. Once added, the shop appears in your sidebar under 'My Shops'." },
      { q: "Can I shop from multiple stores?", a: "Yes! Once you have access to multiple shops, they all appear in your sidebar. Each shop maintains its own cart." },
      { q: "How do I request to open my own store?", a: "Go to 'Open a Store' in the sidebar and fill in the request form. Our team will review your application within 2–3 business days." },
      { q: "How do I update my profile or password?", a: "Go to Settings in the sidebar. You can update your display name, phone number, and password from the Profile and Security sections." },
    ],
  },
  {
    category: "Payments",
    icon: Package,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    items: [
      { q: "What payment methods are accepted?", a: "Currently orders are placed with Cash on Delivery (COD). Online payment via Razorpay is coming soon." },
      { q: "Will I get a refund if I cancel?", a: "If you cancel before dispatch, no charge is made. Refund policies for post-dispatch cancellations depend on the individual store." },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
    >
      <div className={`flex items-center justify-between gap-3 px-4 py-3.5 ${open ? "bg-accent/40" : "bg-card"}`}>
        <span className="text-sm font-medium">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-card/60 text-sm text-muted-foreground leading-relaxed border-t border-border">
          {a}
        </div>
      )}
    </button>
  )
}

export default function HelpPage() {
  const [search, setSearch] = useState("")

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.items.length > 0)

  return (
    <div className="max-w-3xl space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 py-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <HelpCircle className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">How can we help?</h1>
        <p className="text-muted-foreground text-sm">Search our FAQ or browse by topic</p>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Quick links */}
      {!search && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BookOpen, label: "Docs", sub: "Platform guides", color: "text-blue-400", bg: "bg-blue-500/10" },
            { icon: Video, label: "Tutorials", sub: "Video walkthroughs", color: "text-violet-400", bg: "bg-violet-500/10" },
            { icon: MessageSquare, label: "Community", sub: "Ask other users", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map(({ icon: Icon, label, sub, color, bg }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 text-center space-y-2 cursor-not-allowed opacity-70">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mx-auto`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
              </div>
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Coming soon</span>
            </div>
          ))}
        </div>
      )}

      {/* FAQ */}
      <div className="space-y-6">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No results for "{search}"</p>
          </div>
        )}
        {filtered.map((cat) => {
          const Icon = cat.icon
          return (
            <section key={cat.category} className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span className={`p-1.5 rounded-lg ${cat.bg}`}><Icon className={`h-4 w-4 ${cat.color}`} /></span>
                {cat.category}
              </h2>
              <div className="space-y-2">
                {cat.items.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
              </div>
            </section>
          )
        })}
      </div>

      {/* Still need help */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Still need help?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Our support team usually responds within a few hours.</p>
          </div>
          <Button size="sm" className="shrink-0 gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Contact Us
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
