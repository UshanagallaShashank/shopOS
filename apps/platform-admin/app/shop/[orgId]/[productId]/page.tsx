"use client"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ShoppingCart, Plus, Minus, Star, ImageOff,
  Package, X, CheckCircle2, Tag,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { useCartContext } from "@/components/cart-context"
import { Button } from "@/components/ui/button"
import { TemplateShell } from "@/components/template-shell"
import type { ReviewCreate } from "@/lib/types"

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-4 w-4"
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${cls} ${n <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
      ))}
    </span>
  )
}

function ClickableStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hov, setHov] = useState(0)
  return (
    <span className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(0)}>
          <Star className={`h-7 w-7 transition-colors ${n <= (hov || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/25 hover:text-yellow-400/60"}`} />
        </button>
      ))}
    </span>
  )
}

function CartDrawer({ orgId, userId, onClose }: { orgId: string; userId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { items, count, total, setQty, remove, clear } = useCartContext()
  const [placed, setPlaced] = useState(false)
  const [err, setErr] = useState("")

  const placeOrder = useMutation({
    mutationFn: () =>
      api.orders.create({
        org_id: orgId, user_id: userId,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.qty, price_at_purchase: i.product.price })),
        total,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-orders"] }); clear(); setPlaced(true) },
    onError: (e: Error) => setErr(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-card border-l border-border flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-4 w-4" /> Cart
            {count > 0 && <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">{count}</span>}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {placed ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">Order Placed!</p>
              <p className="text-sm text-muted-foreground mt-1">₹{total.toLocaleString("en-IN")}</p>
            </div>
            <Link href="/end-user"><Button variant="outline" size="sm" onClick={onClose}>View My Orders</Button></Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {items.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                </div>
              )}
              {items.map(({ product, variant, qty }) => (
                <div key={`${product.id}::${variant?.id ?? "base"}`} className="flex gap-3 p-3 rounded-xl border border-border bg-background/50">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-14 w-14 rounded-lg object-contain bg-muted shrink-0 border border-border" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted shrink-0 flex items-center justify-center border border-border">
                      <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                    {variant && <p className="text-[11px] text-muted-foreground">{[variant.color, variant.size].filter(Boolean).join(" · ")}</p>}
                    <p className="text-xs text-muted-foreground">₹{Number(product.price + (variant?.price_adjustment ?? 0)).toLocaleString("en-IN")}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => setQty(product.id, variant?.id ?? null, qty - 1)}
                        className="h-6 w-6 rounded-md border border-border hover:bg-accent flex items-center justify-center transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center text-foreground">{qty}</span>
                      <button onClick={() => setQty(product.id, variant?.id ?? null, qty + 1)} disabled={qty >= (variant?.stock ?? product.stock)}
                        className="h-6 w-6 rounded-md border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40">
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={() => remove(product.id, variant?.id ?? null)} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3 bg-card">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({count} item{count !== 1 ? "s" : ""})</span>
                  <span className="font-bold text-foreground">₹{total.toLocaleString("en-IN")}</span>
                </div>
                {err && <p className="text-destructive text-xs">{err}</p>}
                <Button className="w-full gap-2 h-11" onClick={() => placeOrder.mutate()} disabled={placeOrder.isPending}>
                  {placeOrder.isPending ? "Placing order…" : `Place Order · ₹${total.toLocaleString("en-IN")}`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { orgId, productId } = useParams<{ orgId: string; productId: string }>()
  const { shopUser } = useAuth()
  const qc = useQueryClient()

  const { add, setQty, count, total, items } = useCartContext()
  const [cartOpen, setCartOpen] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [reviewErr, setReviewErr] = useState("")

  const { data: org } = useQuery({ queryKey: ["org", orgId], queryFn: () => api.orgs.get(orgId) })
  const { data: product, isLoading } = useQuery({ queryKey: ["product", productId], queryFn: () => api.products.get(productId) })
  const { data: reviews = [] } = useQuery({ queryKey: ["reviews", productId], queryFn: () => api.reviews.list(productId) })

  const submitReview = useMutation({
    mutationFn: (data: ReviewCreate) => api.reviews.create(productId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reviews", productId] }); setRating(0); setComment(""); setReviewErr("") },
    onError: (e: Error) => setReviewErr(e.message),
  })

  if (isLoading) return (
    <TemplateShell org={org}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          <div className="h-6 w-24 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
            <div className="space-y-4">{[1,2,3,4].map(n => <div key={n} className="h-8 rounded bg-muted animate-pulse" />)}</div>
          </div>
        </div>
      </div>
    </TemplateShell>
  )

  if (!product) return (
    <TemplateShell org={org}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
          <Link href={`/shop/${orgId}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to shop
          </Link>
          <p className="text-destructive">Product not found.</p>
        </div>
      </div>
    </TemplateShell>
  )

  const imgs = product.images ?? []
  const inCart = items.find((i) => i.product.id === product.id)
  const alreadyReviewed = reviews.some((r) => r.user_id === shopUser?.id)
  const outOfStock = product.stock === 0
  const lowStock = !outOfStock && product.stock < 5

  return (
    <TemplateShell org={org}>
      <div className="min-h-screen bg-background text-foreground">

        {/* Sticky top bar */}
        <div className="sticky top-0 z-30 bg-card/70 backdrop-blur-sm border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href={`/shop/${orgId}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{org?.name ?? "Back to shop"}</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:border-primary/40 transition-colors text-sm font-medium text-foreground">
              <ShoppingCart className="h-4 w-4" /> Cart
              {count > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

          {/* Product grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

            {/* Image gallery */}
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl border border-border bg-muted overflow-hidden">
                {imgs.length > 0 ? (
                  <img src={imgs[imgIdx]} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="h-16 w-16 text-muted-foreground/25" />
                  </div>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {imgs.map((url, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${i === imgIdx ? "border-primary" : "border-border hover:border-primary/40"}`}>
                      <img src={url} alt="" className="w-full h-full object-contain bg-muted" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="flex flex-col gap-4">
              {product.category && (
                <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  <Tag className="h-3 w-3" />{product.category}
                </span>
              )}

              <h1 className="text-3xl font-bold leading-tight text-foreground">{product.name}</h1>

              {product.avg_rating != null && (
                <div className="flex items-center gap-2">
                  <Stars value={product.avg_rating} size="lg" />
                  <span className="text-sm text-muted-foreground">
                    {product.avg_rating.toFixed(1)} · {product.review_count} review{product.review_count !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <p className="text-4xl font-bold text-foreground">₹{Number(product.price).toLocaleString("en-IN")}</p>

              {/* Stock status */}
              <div className={`inline-flex items-center gap-1.5 text-sm font-medium w-fit px-3 py-1.5 rounded-full ${
                outOfStock
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : lowStock
                  ? "bg-yellow-400/10 text-yellow-500 border border-yellow-400/20"
                  : "bg-green-500/10 text-green-500 border border-green-500/20"
              }`}>
                <Package className="h-3.5 w-3.5" />
                {outOfStock ? "Out of stock" : lowStock ? `Only ${product.stock} left` : `${product.stock} in stock`}
              </div>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed border-t border-border pt-4">
                  {product.description}
                </p>
              )}

              {/* CTA */}
              <div className="mt-auto pt-4 border-t border-border space-y-3">
                {outOfStock ? (
                  <Button className="w-full h-12" disabled>Out of Stock</Button>
                ) : inCart ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 justify-center rounded-xl border border-border bg-card p-3">
                      <button onClick={() => setQty(product.id, inCart.variant?.id ?? null, inCart.qty - 1)}
                        className="h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-accent transition-colors">
                        <Minus className="h-4 w-4 text-foreground" />
                      </button>
                      <span className="text-xl font-bold w-8 text-center text-foreground">{inCart.qty}</span>
                      <button onClick={() => setQty(product.id, inCart.variant?.id ?? null, inCart.qty + 1)} disabled={inCart.qty >= (inCart.variant?.stock ?? product.stock)}
                        className="h-9 w-9 rounded-xl border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <Button className="flex-1 gap-2 h-12" onClick={() => setCartOpen(true)}>
                      <ShoppingCart className="h-4 w-4" /> View Cart · ₹{total.toLocaleString("en-IN")}
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full gap-2 h-12 text-base" onClick={() => add(product)}>
                    <ShoppingCart className="h-5 w-5" /> Add to Cart
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="border-t border-border pt-8 space-y-6">
            <h2 className="text-xl font-bold text-foreground">
              Reviews {reviews.length > 0 && <span className="text-muted-foreground font-normal text-base ml-1">({reviews.length})</span>}
            </h2>

            {shopUser && !alreadyReviewed && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <p className="font-medium text-foreground">Leave a review</p>
                <ClickableStars value={rating} onChange={setRating} />
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience (optional)" rows={3}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                {reviewErr && <p className="text-destructive text-sm">{reviewErr}</p>}
                <Button disabled={rating === 0 || submitReview.isPending}
                  onClick={() => submitReview.mutate({ rating, comment: comment || undefined })}>
                  {submitReview.isPending ? "Submitting…" : "Submit Review"}
                </Button>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                          {r.user_email?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.user_email ?? "User"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {cartOpen && shopUser && (
        <CartDrawer orgId={orgId} userId={shopUser.id} onClose={() => setCartOpen(false)} />
      )}

      {count > 0 && !cartOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground shadow-xl hover:opacity-90 transition-opacity font-medium">
            <ShoppingCart className="h-4 w-4" />
            {count} item{count !== 1 ? "s" : ""} · ₹{total.toLocaleString("en-IN")}
          </button>
        </div>
      )}
    </TemplateShell>
  )
}
