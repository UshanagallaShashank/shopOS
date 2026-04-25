"use client"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ImagePlus, X, ChevronUp, ChevronDown, Star, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReviewCreate } from "@/lib/types"

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`h-4 w-4 ${
              n <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function EditProductPage() {
  const { id: orgId, productId } = useParams<{ id: string; productId: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { shopUser } = useAuth()

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.products.get(productId),
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => api.reviews.list(productId),
  })

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("0")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [images, setImages] = useState<{ url: string; name: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState("")

  // New review state
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [reviewError, setReviewError] = useState("")

  useEffect(() => {
    if (product) {
      setName(product.name)
      setPrice(String(product.price))
      setStock(String(product.stock))
      setCategory(product.category ?? "")
      setDescription(product.description ?? "")
      setIsActive(product.is_active)
      setImages((product.images ?? []).map((url) => ({ url, name: "" })))
    }
  }, [product])

  const update = useMutation({
    mutationFn: () =>
      api.products.update(productId, {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        is_active: isActive,
        category: category || undefined,
        description: description || undefined,
        images: images.map((i) => i.url),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", orgId] })
      router.push(`/orgs/${orgId}`)
    },
    onError: (e: Error) => setFormError(e.message),
  })

  async function handleImageFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > 8) { setFormError("Maximum 8 images"); return }
    setUploading(true)
    const newImgs = await Promise.all(files.map(async (f) => ({ url: await fileToDataUrl(f), name: f.name })))
    setImages((prev) => [...prev, ...newImgs])
    setUploading(false)
    e.target.value = ""
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setImages((prev) => {
      const next = [...prev]
      const t = idx + dir
      if (t < 0 || t >= next.length) return next
      ;[next[idx], next[t]] = [next[t], next[idx]]
      return next
    })
  }

  const submitReview = useMutation({
    mutationFn: (data: ReviewCreate) => api.reviews.create(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] })
      qc.invalidateQueries({ queryKey: ["product", productId] })
      setNewRating(0)
      setNewComment("")
      setReviewError("")
    },
    onError: (e: Error) => setReviewError(e.message),
  })

  const deleteReview = useMutation({
    mutationFn: (id: string) => api.reviews.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] })
      qc.invalidateQueries({ queryKey: ["product", productId] })
    },
  })

  const canManage = shopUser?.role === "platform_admin" || shopUser?.role === "org_admin"
  const alreadyReviewed = reviews.some((r) => r.user_id === shopUser?.id)

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/orgs/${orgId}`} className="text-sm text-muted-foreground hover:text-foreground inline-block">
        ← Back to Org
      </Link>

      {/* Edit form */}
      <Card>
        <CardHeader><CardTitle>Edit Product</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); setFormError(""); update.mutate() }} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (₹)</Label>
                <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Category (optional)</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ethnic Wear" />
            </div>

            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* Image management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Images <span className="text-xs text-muted-foreground">(first = cover)</span></Label>
                <label htmlFor="img-edit-upload">
                  <Button type="button" size="sm" variant="outline" asChild disabled={uploading || images.length >= 8}>
                    <span className="cursor-pointer gap-1.5"><ImagePlus className="h-3.5 w-3.5" /> Add</span>
                  </Button>
                </label>
                <input id="img-edit-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageFiles} />
              </div>

              {images.length === 0 ? (
                <label htmlFor="img-edit-upload" className="cursor-pointer block border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
                  <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No images yet — click to upload</p>
                </label>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className={`relative group rounded-lg overflow-hidden border-2 ${idx === 0 ? "border-primary" : "border-border"}`}>
                      <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">COVER</span>
                      )}
                      <div className="absolute bottom-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => moveImage(idx, -1)} disabled={idx === 0}
                          className="bg-black/70 hover:bg-black text-white rounded p-0.5 disabled:opacity-30">
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1}
                          className="bg-black/70 hover:bg-black text-white rounded p-0.5 disabled:opacity-30">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <button type="button" onClick={() => setImages((p) => p.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <label htmlFor="img-edit-upload" className="cursor-pointer border-2 border-dashed border-border rounded-lg aspect-square flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                      <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">Add more</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary" />
              <Label htmlFor="active">Active (visible on storefront)</Label>
            </div>

            {formError && <p className="text-destructive text-sm">{formError}</p>}
            <Button type="submit" disabled={update.isPending} className="w-full">
              {update.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reviews section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Reviews ({reviews.length})
              {product?.avg_rating != null && (
                <span className="ml-3 flex items-center gap-1 text-sm font-normal text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {product.avg_rating.toFixed(1)} avg
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Submit review (non-admin users) */}
          {!canManage && !alreadyReviewed && (
            <div className="space-y-3 p-4 rounded-lg border border-border bg-accent/20">
              <p className="text-sm font-medium">Leave a review</p>
              <StarRating value={newRating} onChange={setNewRating} />
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts (optional)"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
              {reviewError && <p className="text-destructive text-xs">{reviewError}</p>}
              <Button
                size="sm"
                disabled={newRating === 0 || submitReview.isPending}
                onClick={() => submitReview.mutate({ rating: newRating, comment: newComment || undefined })}
              >
                {submitReview.isPending ? "Submitting…" : "Submit Review"}
              </Button>
            </div>
          )}
          {alreadyReviewed && !canManage && (
            <p className="text-sm text-muted-foreground">You have already reviewed this product.</p>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="flex gap-3 p-4 rounded-lg border border-border bg-card">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <StarRating value={r.rating} />
                      <span className="text-xs text-muted-foreground">{r.user_email ?? r.user_id.slice(0, 8) + "…"}</span>
                    </div>
                    {r.comment && <p className="text-sm text-foreground">{r.comment}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  {(canManage || r.user_id === shopUser?.id) && (
                    <button
                      onClick={() => deleteReview.mutate(r.id)}
                      disabled={deleteReview.isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      title="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
