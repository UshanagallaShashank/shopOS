"use client"
import { useState, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ShoppingCart, Plus, Minus, X, ImageOff, Package,
  CheckCircle2, Search, MapPin, Mail, Phone, Tag,
  ChevronLeft, Star,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { useCartContext } from "@/components/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TemplateShell } from "@/components/template-shell"

function Stars({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-3 w-3 ${n <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
      ))}
    </span>
  )
}

// ── Address form ───────────────────────────────────────────────────────────
type Address = {
  address: string; city: string; state: string
  pincode: string; phone: string; notes: string
}
const EMPTY_ADDRESS: Address = { address: "", city: "", state: "", pincode: "", phone: "", notes: "" }

function AddressForm({
  value, onChange,
}: { value: Address; onChange: (a: Address) => void }) {
  const field = (
    key: keyof Address, label: string, placeholder: string, type = "text"
  ) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        className="h-9 text-sm"
      />
    </div>
  )

  return (
    <div className="space-y-3">
      {field("address", "Street address *", "123 MG Road, Apartment 4B")}
      <div className="grid grid-cols-2 gap-2">
        {field("city", "City *", "Mumbai")}
        {field("state", "State *", "Maharashtra")}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {field("pincode", "PIN code *", "400001")}
        {field("phone", "Phone *", "+91 98765 43210", "tel")}
      </div>
      {field("notes", "Delivery instructions (optional)", "Leave at door, call before delivery")}
    </div>
  )
}

// ── Cart sidebar ───────────────────────────────────────────────────────────
function CartSidebar({ orgId, userId, onClose }: { orgId: string; userId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { items, count, total, setQty, remove, clear } = useCartContext()
  const [step, setStep] = useState<"cart" | "address" | "done">("cart")
  const [addr, setAddr] = useState<Address>(EMPTY_ADDRESS)
  const [err, setErr] = useState("")

  const isAddrValid = addr.address.trim() && addr.city.trim() &&
    addr.state.trim() && addr.pincode.trim() && addr.phone.trim()

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
        shipping_address: addr.address,
        shipping_city: addr.city,
        shipping_state: addr.state,
        shipping_pincode: addr.pincode,
        shipping_phone: addr.phone,
        customer_notes: addr.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] })
      clear()
      setStep("done")
    },
    onError: (e: Error) => setErr(e.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-card border-l border-border flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          {step === "address" && (
            <button onClick={() => { setStep("cart"); setErr("") }}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="font-semibold flex-1 text-foreground flex items-center gap-2">
            {step === "cart" && <><ShoppingCart className="h-4 w-4" /> Cart {count > 0 && <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">{count}</span>}</>}
            {step === "address" && "Delivery Details"}
            {step === "done" && "Order Placed!"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Done state */}
        {step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">Order Placed!</p>
              <p className="text-sm text-muted-foreground mt-1">We'll notify you when it ships.</p>
            </div>
            <Link href="/end-user">
              <Button variant="outline" size="sm" onClick={onClose}>Track My Order</Button>
            </Link>
          </div>
        )}

        {/* Cart step */}
        {step === "cart" && (
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
                    <img src={product.images[0]} alt={product.name}
                      className="h-14 w-14 rounded-lg object-contain bg-muted shrink-0 border border-border" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted shrink-0 flex items-center justify-center border border-border">
                      <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                    {variant && <p className="text-[11px] text-muted-foreground">{[variant.color, variant.size].filter(Boolean).join(" · ")}</p>}
                    <p className="text-xs text-muted-foreground">₹{Number(product.price + (variant?.price_adjustment ?? 0)).toLocaleString("en-IN")} each</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button onClick={() => setQty(product.id, variant?.id ?? null, qty - 1)}
                        className="h-6 w-6 rounded-md border border-border hover:bg-accent flex items-center justify-center transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center text-foreground">{qty}</span>
                      <button onClick={() => setQty(product.id, variant?.id ?? null, qty + 1)} disabled={qty >= (variant?.stock ?? product.stock)}
                        className="h-6 w-6 rounded-md border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity">
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
                <Button className="w-full gap-2 h-11" onClick={() => setStep("address")}>
                  Proceed to Checkout →
                </Button>
              </div>
            )}
          </>
        )}

        {/* Address step */}
        {step === "address" && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs text-muted-foreground mb-4">Where should we deliver your order?</p>
              <AddressForm value={addr} onChange={setAddr} />
            </div>
            <div className="p-4 border-t border-border space-y-3 bg-card">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-foreground">₹{total.toLocaleString("en-IN")}</span>
              </div>
              {err && <p className="text-destructive text-xs leading-snug">{err}</p>}
              <Button
                className="w-full gap-2 h-11"
                onClick={() => placeOrder.mutate()}
                disabled={placeOrder.isPending || !isAddrValid}
              >
                {placeOrder.isPending ? "Placing order…" : `Place Order · ₹${total.toLocaleString("en-IN")}`}
              </Button>
            </div>
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

  const { add, setQty, count, total, items } = useCartContext()
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const activeProducts = products.filter((p) => p.is_active)

  const categories = useMemo(() => {
    const cats = new Set(activeProducts.map((p) => p.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [activeProducts])

  const filtered = activeProducts.filter((p) => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !activeCategory || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <TemplateShell org={org}>
      <div className="min-h-screen bg-background text-foreground">

        {/* ── Org header ── */}
        <div className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {org?.logo ? (
                <img src={org.logo} alt={org.name} className="h-10 w-10 rounded-xl object-cover border border-border shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 text-primary font-bold text-lg">
                  {org?.name?.[0]?.toUpperCase() ?? "S"}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">{org?.name ?? "Shop"}</h1>
                {org?.category && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />{org.category}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors shrink-0"
            >
              <ShoppingCart className="h-4 w-4 text-foreground" />
              <span className="text-sm font-medium text-foreground hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* ── Search + filters ── */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground h-11"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeCategory === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40 bg-transparent"
                  }`}
                >All</button>
                {categories.map((cat) => (
                  <button key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40 bg-transparent"
                    }`}
                  >{cat}</button>
                ))}
              </div>
            )}
          </div>

          {/* ── Results count ── */}
          {!isLoading && (search || activeCategory) && (
            <p className="text-sm text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {activeCategory && ` in ${activeCategory}`}
              {search && ` for "${search}"`}
            </p>
          )}

          {/* ── Skeleton ── */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, n) => (
                <div key={n} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-foreground">
                  {search ? `No results for "${search}"` : activeCategory ? `No ${activeCategory} products` : "No products yet"}
                </p>
                {(search || activeCategory) && (
                  <button onClick={() => { setSearch(""); setActiveCategory(null) }}
                    className="text-sm text-primary hover:underline">Clear filters</button>
                )}
              </div>
            </div>
          )}

          {/* ── Product grid ── */}
          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((p) => {
                const inCart = items.find((item) => item.product.id === p.id)
                const outOfStock = p.stock === 0
                const lowStock = !outOfStock && p.stock < 5

                return (
                  <div key={p.id}
                    className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col group hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                  >
                    <Link href={`/shop/${orgId}/${p.id}`} className="relative block aspect-square bg-muted overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="h-10 w-10 text-muted-foreground/25" />
                        </div>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="text-xs font-semibold text-foreground bg-card border border-border px-2.5 py-1 rounded-full">
                            Out of stock
                          </span>
                        </div>
                      )}
                      {lowStock && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">
                          {p.stock} left
                        </span>
                      )}
                    </Link>

                    <div className="p-3 flex flex-col gap-1.5 flex-1">
                      <Link href={`/shop/${orgId}/${p.id}`}>
                        <p className="font-medium text-sm leading-snug line-clamp-2 text-foreground hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        {p.category && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{p.category}</p>
                        )}
                      </Link>

                      {p.avg_rating != null && (
                        <div className="flex items-center gap-1">
                          <Stars value={p.avg_rating} />
                          <span className="text-[11px] text-muted-foreground">({p.review_count})</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-1">
                        <p className="font-bold text-sm text-foreground">₹{Number(p.price).toLocaleString("en-IN")}</p>
                        {outOfStock ? null : inCart ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setQty(p.id, inCart.variant?.id ?? null, inCart.qty - 1)}
                              className="h-6 w-6 rounded-lg border border-border bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                              <Minus className="h-3 w-3 text-foreground" />
                            </button>
                            <span className="text-sm font-bold w-4 text-center text-foreground">{inCart.qty}</span>
                            <button onClick={() => setQty(p.id, inCart.variant?.id ?? null, inCart.qty + 1)} disabled={inCart.qty >= (inCart.variant?.stock ?? p.stock)}
                              className="h-6 w-6 rounded-lg border border-primary bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => add(p)}
                            className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 flex items-center gap-1 transition-opacity">
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Org footer ── */}
          {org && (org.description || org.email || org.phone || org.address) && (
            <div className="border-t border-border pt-8 mt-4">
              <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">About {org.name}</p>
                {org.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{org.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {org.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" />{org.email}</span>}
                  {org.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />{org.phone}</span>}
                  {org.address && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" />{org.address}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {cartOpen && shopUser && (
        <CartSidebar orgId={orgId} userId={shopUser.id} onClose={() => setCartOpen(false)} />
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
