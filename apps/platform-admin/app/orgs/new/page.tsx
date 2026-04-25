"use client"
// Create org — rich form with branding, contact, and plan sections
import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, Store, X } from "lucide-react"
import { api } from "@/lib/api"
import type { PlanType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PLAN_OPTIONS = [
  { value: "starter",    label: "Starter",    price: "₹999/mo",   limit: "50 products",       color: "border-border" },
  { value: "pro",        label: "Pro",         price: "₹2,499/mo", limit: "500 products",      color: "border-blue-500/60" },
  { value: "enterprise", label: "Enterprise",  price: "₹6,999/mo", limit: "Unlimited products", color: "border-purple-500/60" },
]

const ORG_CATEGORIES = [
  "Fashion & Apparel", "Electronics", "Food & Grocery", "Beauty & Personal Care",
  "Home & Furniture", "Books & Stationery", "Sports & Fitness", "Toys & Games",
  "Jewellery", "Handicrafts", "Other",
]

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

const selectCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
const sectionCls = "space-y-4 rounded-xl border border-border bg-card p-5"

export default function NewOrgPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const logoRef = useRef<HTMLInputElement>(null)

  // Basic
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [plan, setPlan] = useState<PlanType>("starter")

  // Brand
  const [logo, setLogo] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  // Contact
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")

  const { mutate, isPending, error } = useMutation({
    mutationFn: api.orgs.create,
    onSuccess: (org) => {
      qc.invalidateQueries({ queryKey: ["orgs"] })
      router.push(`/orgs/${org.id}`)
    },
  })

  function handleName(v: string) {
    setName(v)
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await fileToDataUrl(file)
    setLogo(url)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate({
      name, slug, plan,
      logo: logo || undefined,
      description: description || undefined,
      category: category || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/orgs" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        ← Back to Orgs
      </Link>

      <div>
        <h1 className="text-2xl font-bold">New Organisation</h1>
        <p className="text-muted-foreground text-sm mt-1">Set up a new shop on the platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Section 1: Basic ──────────────────────────────────────── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Basic Info</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Shop Name <span className="text-destructive">*</span></Label>
            <Input id="name" value={name} onChange={(e) => handleName(e.target.value)}
              placeholder="Meena Boutique" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">URL Slug <span className="text-destructive">*</span></Label>
            <div className="flex items-center rounded-md border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring overflow-hidden">
              <span className="px-3 text-sm text-muted-foreground border-r border-input bg-muted/30 h-10 flex items-center shrink-0">
                shopOS.in/
              </span>
              <input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)}
                placeholder="meena-boutique" required
                className="flex-1 bg-transparent px-3 h-10 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              <option value="">— Select category —</option>
              {ORG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ── Section 2: Brand ──────────────────────────────────────── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Brand</h2>

          {/* Logo */}
          <div className="space-y-2">
            <Label>Shop Logo</Label>
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="relative h-20 w-20 shrink-0">
                  <img src={logo} alt="Logo" className="h-20 w-20 rounded-xl object-contain border border-border bg-accent/10" />
                  <button type="button" onClick={() => setLogo("")}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => logoRef.current?.click()}
                  className="h-20 w-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors shrink-0">
                  <Store className="h-6 w-6" />
                  <span className="text-xs">Logo</span>
                </button>
              )}
              <div className="space-y-1">
                <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />{logo ? "Change" : "Upload"} Logo
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG or SVG · Shown in the shop header</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers what your shop is about…" rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          </div>
        </div>

        {/* ── Section 3: Contact ────────────────────────────────────── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Contact Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="shop@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Business Address</Label>
            <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No. 12, MG Road, Bengaluru, Karnataka 560001" rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
          </div>
        </div>

        {/* ── Section 4: Plan ───────────────────────────────────────── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLAN_OPTIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlan(p.value as PlanType)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  plan === p.value
                    ? `${p.color} bg-primary/5`
                    : "border-border hover:border-primary/30"
                }`}
              >
                <p className="font-semibold">{p.label}</p>
                <p className="text-lg font-bold mt-1">{p.price}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.limit}</p>
                {plan === p.value && (
                  <span className="mt-2 inline-block text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

        <Button type="submit" disabled={isPending} className="w-full h-11 text-base">
          {isPending ? "Creating…" : "Create Organisation"}
        </Button>
      </form>
    </div>
  )
}
