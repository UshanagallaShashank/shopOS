"use client"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ImagePlus, X, ChevronUp, ChevronDown, GripVertical } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function NewProductPage() {
  const { id: orgId } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("0")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<{ url: string; name: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const { mutate, isPending } = useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", orgId] })
      router.push(`/orgs/${orgId}`)
    },
    onError: (e: Error) => setError(e.message),
  })

  async function handleImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > 8) {
      setError("Maximum 8 images allowed")
      return
    }
    setUploading(true)
    setError("")
    try {
      const newImgs = await Promise.all(
        files.map(async (f) => ({ url: await fileToDataUrl(f), name: f.name }))
      )
      setImages((prev) => [...prev, ...newImgs])
    } catch {
      setError("Failed to read image files")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return next
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    mutate({
      org_id: orgId,
      name,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category || undefined,
      description: description || undefined,
      images: images.map((i) => i.url),
    })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/orgs/${orgId}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to Org
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Floral Silk Kurta" required />
            </div>

            {/* Price + Stock */}
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

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category">Category (optional)</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="Ethnic Wear" />
            </div>

            {/* Description */}
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

            {/* Images */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Product Images <span className="text-xs text-muted-foreground">(up to 8, first = cover)</span></Label>
                <label htmlFor="img-upload">
                  <Button type="button" size="sm" variant="outline" asChild disabled={uploading || images.length >= 8}>
                    <span className="cursor-pointer gap-1.5">
                      <ImagePlus className="h-3.5 w-3.5" />
                      {uploading ? "Loading…" : "Add Images"}
                    </span>
                  </Button>
                </label>
                <input
                  id="img-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFiles}
                />
              </div>

              {images.length === 0 ? (
                <label htmlFor="img-upload" className="cursor-pointer block">
                  <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors">
                    <ImagePlus className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Click to upload images</p>
                    <p className="text-xs text-muted-foreground/70">PNG, JPG, WebP · max 8 · first image = cover photo</p>
                  </div>
                </label>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
                        idx === 0 ? "border-primary" : "border-border"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full aspect-square object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                          COVER
                        </span>
                      )}
                      {/* Order controls */}
                      <div className="absolute bottom-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => moveImage(idx, -1)}
                          disabled={idx === 0}
                          className="bg-black/70 hover:bg-black text-white rounded p-0.5 disabled:opacity-30"
                          title="Move left"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 1)}
                          disabled={idx === images.length - 1}
                          className="bg-black/70 hover:bg-black text-white rounded p-0.5 disabled:opacity-30"
                          title="Move right"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {/* Add more slot */}
                  {images.length < 8 && (
                    <label htmlFor="img-upload" className="cursor-pointer border-2 border-dashed border-border rounded-lg aspect-square flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                      <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">Add more</span>
                    </label>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Hover an image to reorder with ↑↓ arrows or remove it.
              </p>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Adding..." : "Add Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
