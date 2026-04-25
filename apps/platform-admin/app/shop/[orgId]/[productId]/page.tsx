"use client"
// Full product detail page — two-column grid, no modal
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ShoppingCart, Plus, Minus, Star, ImageOff,
  Package, X, CheckCircle2, Minus as MinusIcon
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { useCart } from "@/lib/hooks/useCart"
import { Button } from "@/components/ui/button"
import type { ReviewCreate } from "@/lib/types"

// ── Stars ──────────────────────────────────────────────────────────────────
function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-4 w-4"
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${cls} ${n <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/25"}`} />
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
          <Star className={`h-7 w-7 transition-colors ${n <= (hov || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400/60"}`} />
        </button>
      ))}
    </span>
  )
}

// ── Cart drawer (shared from shop page via localStorage) ──────────────────
function CartDrawer({ orgId, userId, onClose }: { orgId: string; userId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { items, count, total, setQty, remove, clear } = useCart(orgId)
  const [placed, setPlaced] = useState(false)
  const [err, setErr] = useState("")

  const placeOrder = useMutation({
    mutationFn: () =>
      api.orders.create({
        org_id: orgId,
        user_id: userId,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.qty,
          price_at_purchase: i.product.price,
        })),
        total,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] })
      clear()
      setPlaced(true)
    },
    onError: (e: Error) => setErr(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-sm bg-card border-l border-border flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Cart ({count})
          </h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {placed ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-400" />
            <div>
              <p className="font-bold text-lg">Order Placed!</p>
              <p className="text-sm text-muted-foreground mt-1">₹{total.toLocaleString("en-IN")}</p>
            </div>
            <Link href="/end-user">
              <Button variant="outline" size="sm" onClick={onClose}>View My Orders</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Your cart is empty.</p>
              )}
              {items.map(({ product, qty }) => (
                <div key={product.id} className="flex gap-3 p-3 rounded-xl border border-border bg-background">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name}
                      className="h-14 w-14 rounded-lg object-contain bg-accent/10 shrink-0 border border-border" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-accent/30 shrink-0 flex items-center justify-center border border-border">
                      <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">₹{Number(product.price).toLocaleString("en-IN")} each</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => setQty(product.id, qty - 1)}
                        className="h-6 w-6 rounded-md border border-border bg-accent/30 hover:bg-accent flex items-center justify-center">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{qty}</span>
                      <button onClick={() => setQty(product.id, qty + 1)}
                        disabled={qty >= product.stock}
                        className="h-6 w-6 rounded-md border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40">
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={() => remove(product.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({count} items)</span>
                  <span className="font-bold">₹{total.toLocaleString("en-IN")}</span>
                </div>
                {err && <p className="text-destructive text-xs">{err}</p>}
                <Button className="w-full gap-2" onClick={() => placeOrder.mutate()} disabled={placeOrder.isPending}>
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
  const router = useRouter()

  const { add, setQty, remove, count, total, items } = useCart(orgId)
  const [cartOpen, setCartOpen] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [reviewErr, setReviewErr] = useState("")

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.products.get(productId),
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => api.reviews.list(productId),
  })

  const submitReview = useMutation({
    mutationFn: (data: ReviewCreate) => api.reviews.create(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] })
      setRating(0); setComment(""); setReviewErr("")
    },
    onError: (e: Error) => setReviewErr(e.message),
  })

  if (isLoading) return (
    <div className="space-y-4 max-w-5xl">
      <div className="h-8 w-32 rounded bg-accent/30 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl bg-accent/30 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(n => <div key={n} className="h-8 rounded bg-accent/30 animate-pulse" />)}
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="space-y-4">
      <Link href={`/shop/${orgId}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>
      <p className="text-destructive">Product not found.</p>
    </div>
  )

  const imgs = product.images ?? []
  const inCart = items.find((i) => i.product.id === product.id)
  const alreadyReviewed = reviews.some((r) => r.user_id === shopUser?.id)
  const outOfStock = product.stock === 0

  return (
    <div className="space-y-10 max-w-5xl">
      {/* Back + Cart */}
      <div className="flex items-center justify-between">
        <Link href={`/shop/${orgId}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-sm font-medium"
        >
          <ShoppingCart className="h-4 w-4" /> Cart
          {count > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

        {/* Left — image gallery */}
        <div className="space-y-3">
          {imgs.length > 0 ? (
            <>
              <div className="aspect-square rounded-2xl border border-border bg-accent/10 overflow-hidden">
                <img
                  src={imgs[imgIdx]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              {imgs.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {imgs.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`aspect-square rounded-xl border-2 overflow-hidden transition-colors ${
                        i === imgIdx ? "border-primary" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-contain bg-accent/10" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-2xl border border-border bg-accent/20 flex items-center justify-center">
              <ImageOff className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Right — product info */}
        <div className="space-y-5 flex flex-col">
          {/* Category */}
          {product.category && (
            <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {product.category}
            </span>
          )}

          {/* Name */}
          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>

          {/* Rating */}
          {product.avg_rating != null && (
            <div className="flex items-center gap-2">
              <Stars value={product.avg_rating} size="lg" />
              <span className="text-sm text-muted-foreground">
                {product.avg_rating.toFixed(1)} · {product.review_count} review{product.review_count !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Price */}
          <p className="text-4xl font-bold">₹{Number(product.price).toLocaleString("en-IN")}</p>

          {/* Stock */}
          <div className={`flex items-center gap-1.5 text-sm font-medium ${
            outOfStock ? "text-destructive" : product.stock < 5 ? "text-yellow-400" : "text-green-400"
          }`}>
            <Package className="h-4 w-4" />
            {outOfStock ? "Out of stock" : product.stock < 5 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed border-t border-border pt-4">
              {product.description}
            </p>
          )}

          {/* Add to cart / qty */}
          <div className="mt-auto pt-4 border-t border-border space-y-3">
            {outOfStock ? (
              <Button className="w-full" disabled>Out of Stock</Button>
            ) : inCart ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 flex-1 justify-center rounded-xl border border-border bg-card p-3">
                  <button
                    onClick={() => setQty(product.id, inCart.qty - 1)}
                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-bold w-8 text-center">{inCart.qty}</span>
                  <button
                    onClick={() => setQty(product.id, inCart.qty + 1)}
                    disabled={inCart.qty >= product.stock}
                    className="h-8 w-8 rounded-lg border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  View Cart · ₹{total.toLocaleString("en-IN")}
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
        <h2 className="text-xl font-bold">
          Reviews
          {reviews.length > 0 && <span className="text-muted-foreground font-normal text-base ml-2">({reviews.length})</span>}
        </h2>

        {/* Write review */}
        {shopUser && !alreadyReviewed && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <p className="font-medium">Leave a review</p>
            <ClickableStars value={rating} onChange={setRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)"
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            {reviewErr && <p className="text-destructive text-sm">{reviewErr}</p>}
            <Button
              disabled={rating === 0 || submitReview.isPending}
              onClick={() => submitReview.mutate({ rating, comment: comment || undefined })}
            >
              {submitReview.isPending ? "Submitting…" : "Submit Review"}
            </Button>
          </div>
        )}

        {reviews.length === 0 && (
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
        )}

        {/* Review list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {r.user_email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.user_email ?? "User"}</p>
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
      </div>

      {/* Cart drawer */}
      {cartOpen && shopUser && (
        <CartDrawer
          orgId={orgId}
          userId={shopUser.id}
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* Sticky cart pill */}
      {count > 0 && !cartOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <ShoppingCart className="h-4 w-4" />
            {count} item{count !== 1 ? "s" : ""} · ₹{total.toLocaleString("en-IN")}
          </button>
        </div>
      )}
    </div>
  )
}
