"use client"
// Create org form — slug auto-generated from name, mirrors backend validator
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import type { PlanType } from "@/lib/types"

export default function NewOrgPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [plan, setPlan] = useState<PlanType>("starter")

  const { mutate, isPending, error } = useMutation({
    mutationFn: api.orgs.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs"] })
      router.push("/orgs")
    },
  })

  function handleName(v: string) {
    setName(v)
    // Auto-generate URL-safe slug — matches the backend's slug_lowercase validator
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
  }

  return (
    <div className="max-w-md">
      <Link href="/orgs" className="text-sm text-gray-400 hover:text-white mb-6 inline-block">← Back</Link>
      <h1 className="text-2xl font-bold mb-6">New Org</h1>

      <form onSubmit={(e) => { e.preventDefault(); mutate({ name, slug, plan }) }} className="space-y-4">
        <Field label="Shop Name">
          <input value={name} onChange={(e) => handleName(e.target.value)} placeholder="Meena Boutique" required className="input" />
        </Field>

        <Field label="URL Slug">
          <div className="flex items-center bg-[#1A1A2E] border border-white/10 rounded-lg overflow-hidden focus-within:border-[#E94560] transition-colors">
            <span className="px-3 text-gray-500 text-sm shrink-0">shopOS.in/</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="meena-boutique" required className="flex-1 bg-transparent py-2 pr-3 text-white outline-none text-sm" />
          </div>
        </Field>

        <Field label="Plan">
          <select value={plan} onChange={(e) => setPlan(e.target.value as PlanType)} className="input">
            <option value="starter">Starter — ₹999/mo · 50 products</option>
            <option value="pro">Pro — ₹2,499/mo · 500 products</option>
            <option value="enterprise">Enterprise — ₹6,999/mo · Unlimited</option>
          </select>
        </Field>

        {error && <p className="text-red-400 text-sm">{error.message}</p>}

        <button type="submit" disabled={isPending} className="w-full bg-[#E94560] hover:bg-[#d63050] disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {isPending ? "Creating..." : "Create Org"}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
