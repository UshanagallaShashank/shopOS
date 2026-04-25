"use client"
// Add product to an org — org_id comes from the URL param
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="max-w-md space-y-6">
      <Link href={`/orgs/${orgId}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to Org
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Floral Silk Kurta" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" type="number" min="0" step="0.01" placeholder="999"
                  value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0"
                  value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category (optional)</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="Ethnic Wear" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short product description..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error.message}</p>}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Adding..." : "Add Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
