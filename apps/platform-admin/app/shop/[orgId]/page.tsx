"use client"
// Shop grid — browse products, add to cart inline, click product to open detail page
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ShoppingCart, Plus, Minus, X, ImageOff,
  ArrowLeft, Package, CheckCircle2, Search
} from "lucide-react"
import { Star } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { useCart } from "@/lib/hooks/useCart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ── Stars display ─────────────────────────────────────────────────────────
function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/25"}`} />
      ))}
    </span>
  )
}

// ── Cart sidebar ───────────────────────────────────────────────────────────
function CartSidebar({ orgId, userId, onClose }: {
  orgId: string; userId: string; onClose: () => void
}) {
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
export default function ShopOrgPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const { shopUser } = useAuth()

  const { data: org } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => api.orgs.get(orgId),
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products-shop", orgId],
    queryFn: () => api.products.list(orgId),
  })

  const { add, setQty, remove, count, total, items } = useCart(orgId)
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState("")

  const activeProducts = products.filter((p) => p.is_active)
  const filtered = activeProducts.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/shop" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{org?.name ?? "Shop"}</h1>
            <p className="text-xs text-muted-foreground">{org?.slug}.shopOS.in</p>
          </div>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="text-sm font-medium">Cart</span>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="aspect-[3/4] rounded-2xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
          <Package className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            {search ? `No products matching "${search}"` : "No products available."}
          </p>
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const inCart = items.find((i) => i.product.id === p.id)
          return (
            <div key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col group">
              {/* Image — links to detail page */}
              <Link href={`/shop/${orgId}/${p.id}`} className="block aspect-square bg-accent/10 overflow-hidden">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full object-contain transition-opacity group-hover:opacity-90"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="p-3 flex flex-col gap-2 flex-1">
                {/* Name — links to detail page */}
                <Link href={`/shop/${orgId}/${p.id}`} className="block">
                  <p className="font-medium text-sm line-clamp-2 leading-snug hover:text-primary transition-colors">{p.name}</p>
                  {p.category && <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>}
                </Link>

                {p.avg_rating != null && (
                  <div className="flex items-center gap-1">
                    <Stars value={p.avg_rating} />
                    <span className="text-xs text-muted-foreground">({p.review_count})</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-1">
                  <p className="font-bold text-sm">₹{Number(p.price).toLocaleString("en-IN")}</p>
                  {p.stock === 0 ? (
                    <span className="text-xs text-destructive font-medium">Out of stock</span>
                  ) : inCart ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQty(p.id, inCart.qty - 1)}
                        className="h-6 w-6 rounded-md border border-border bg-accent flex items-center justify-center hover:bg-accent/80"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{inCart.qty}</span>
                      <button
                        onClick={() => setQty(p.id, inCart.qty + 1)}
                        disabled={inCart.qty >= p.stock}
                        className="h-6 w-6 rounded-md border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => add(p)}
                      className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cart sidebar */}
      {cartOpen && shopUser && (
        <CartSidebar
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
