"use client"
// Edit org — same rich form as new, pre-filled
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, Store, X } from "lucide-react"
import { api } from "@/lib/api"
import type { OrgStatus, PlanType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PLAN_OPTIONS = [
  { value: "starter",    label: "Starter",    price: "₹999/mo",   limit: "50 products",        color: "border-border" },
  { value: "pro",        label: "Pro",         price: "₹2,499/mo", limit: "500 products",       color: "border-blue-500/60" },
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

export default function EditOrgPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const logoRef = useRef<HTMLInputElement>(null)

  const { data: org } = useQuery({ queryKey: ["orgs", id], queryFn: () => api.orgs.get(id) })

  const [name, setName] = useState("")
  const [status, setStatus] = useState<OrgStatus>("active")
  const [plan, setPlan] = useState<PlanType>("starter")
  const [logo, setLogo] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")

  useEffect(() => {
    if (org) {
      setName(org.name)
      setStatus(org.status)
      setPlan(org.plan)
      setLogo(org.logo ?? "")
      setDescription(org.description ?? "")
      setCategory(org.category ?? "")
      setEmail(org.email ?? "")
      setPhone(org.phone ?? "")
      setAddress(org.address ?? "")
    }
  }, [org])

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: Parameters<typeof api.orgs.update>[1]) => api.orgs.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs"] })
      router.push(`/orgs/${id}`)
    },
  })

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogo(await fileToDataUrl(file))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate({
      name, status, plan,
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
      <Link href={`/orgs/${id}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        ← Back to Org
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Edit Organisation</h1>
        <p className="text-muted-foreground text-sm mt-1">{org?.slug}.shopOS.in</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Basic ── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Basic Info</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Shop Name <span className="text-destructive">*</span></Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value as OrgStatus)} className={selectCls}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                <option value="">— Select —</option>
                {ORG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Brand ── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Brand</h2>

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
                <p className="text-xs text-muted-foreground">PNG, JPG or SVG</p>
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

        {/* ── Contact ── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="shop@example.com" />
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

        {/* ── Plan ── */}
        <div className={sectionCls}>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLAN_OPTIONS.map((p) => (
              <button key={p.value} type="button" onClick={() => setPlan(p.value as PlanType)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  plan === p.value ? `${p.color} bg-primary/5` : "border-border hover:border-primary/30"
                }`}>
                <p className="font-semibold">{p.label}</p>
                <p className="text-lg font-bold mt-1">{p.price}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.limit}</p>
                {plan === p.value && (
                  <span className="mt-2 inline-block text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{(error as Error).message}</p>}

        <Button type="submit" disabled={isPending} className="w-full h-11 text-base">
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
