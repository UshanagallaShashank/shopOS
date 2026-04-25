"use client"
// Add product to an org — org_id comes from the URL param
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"

export default function NewProductPage() {
  const { id: orgId } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("0")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")

  const { mutate, isPending, error } = useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", orgId] })
      router.push(`/orgs/${orgId}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate({
      org_id: orgId,
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category || undefined,
      description: description || undefined,
    })
  }

  return (
    <div className="max-w-md">
      <Link href={`/orgs/${orgId}`} className="text-sm text-gray-400 hover:text-white mb-6 inline-block">← Back to Org</Link>
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Product Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Floral Silk Kurta" required className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₹)">
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="999" required className="input" />
          </Field>
          <Field label="Stock">
            <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" required className="input" />
          </Field>
        </div>

        <Field label="Category (optional)">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ethnic Wear" className="input" />
        </Field>

        <Field label="Description (optional)">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short product description..." rows={3} className="input resize-none" />
        </Field>

        {error && <p className="text-red-400 text-sm">{error.message}</p>}

        <button type="submit" disabled={isPending} className="w-full bg-[#E94560] hover:bg-[#d63050] disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {isPending ? "Adding..." : "Add Product"}
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
