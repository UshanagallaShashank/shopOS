"use client"
// Edit product — pre-fills current values, PATCH on submit
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EditProductPage() {
  const { id: orgId, productId } = useParams<{ id: string; productId: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.products.get(productId),
  })

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("0")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (product) {
      setName(product.name)
      setPrice(String(product.price))
      setStock(String(product.stock))
      setIsActive(product.is_active)
    }
  }, [product])

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => api.products.update(productId, {
      name, price: parseFloat(price), stock: parseInt(stock), is_active: isActive,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", orgId] })
      router.push(`/orgs/${orgId}`)
    },
  })

  return (
    <div className="max-w-md space-y-6">
      <Link href={`/orgs/${orgId}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to Org
      </Link>
      <Card>
        <CardHeader><CardTitle>Edit Product</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); mutate() }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" type="number" min="0" step="0.01"
                  value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0"
                  value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input id="active" type="checkbox" checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary" />
              <Label htmlFor="active">Active (visible on storefront)</Label>
            </div>
            {error && <p className="text-destructive text-sm">{error.message}</p>}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
