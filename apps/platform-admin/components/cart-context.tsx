"use client"
// Shared cart context for all /shop/[orgId]/* pages — fixes the "3 empty carts" bug
// where each component called useCart() independently, creating separate state instances
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import type { Product, ProductVariant } from "@/lib/types"

export type CartItem = {
  product: Product
  variant: ProductVariant | null
  qty: number
}

type CartCtx = {
  orgId: string
  items: CartItem[]
  count: number
  total: number
  add: (product: Product, variant?: ProductVariant | null) => void
  setQty: (productId: string, variantId: string | null, qty: number) => void
  remove: (productId: string, variantId: string | null) => void
  clear: () => void
}

const CartContext = createContext<CartCtx | null>(null)

function cartKey(orgId: string) { return `shopos_cart_${orgId}` }

function loadItems(orgId: string): CartItem[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(cartKey(orgId)) ?? "[]") }
  catch { return [] }
}

function itemId(productId: string, variantId: string | null) {
  return variantId ? `${productId}::${variantId}` : productId
}

export function CartProvider({ orgId, children }: { orgId: string; children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadItems(orgId))

  // Persist whenever items change
  useEffect(() => {
    localStorage.setItem(cartKey(orgId), JSON.stringify(items))
  }, [items, orgId])

  const add = useCallback((product: Product, variant: ProductVariant | null = null) => {
    const vid = variant?.id ?? null
    const maxStock = variant ? variant.stock : product.stock
    setItems(prev => {
      const existing = prev.find(i =>
        i.product.id === product.id && (i.variant?.id ?? null) === vid
      )
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id && (i.variant?.id ?? null) === vid
            ? { ...i, qty: Math.min(i.qty + 1, maxStock) }
            : i
        )
      }
      return [...prev, { product, variant, qty: 1 }]
    })
  }, [])

  const setQty = useCallback((productId: string, variantId: string | null, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i =>
        !(i.product.id === productId && (i.variant?.id ?? null) === variantId)
      ))
    } else {
      setItems(prev => prev.map(i =>
        i.product.id === productId && (i.variant?.id ?? null) === variantId
          ? { ...i, qty } : i
      ))
    }
  }, [])

  const remove = useCallback((productId: string, variantId: string | null) => {
    setItems(prev => prev.filter(i =>
      !(i.product.id === productId && (i.variant?.id ?? null) === variantId)
    ))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((s, i) => s + i.qty, 0)
  const total = items.reduce((s, i) => {
    const price = i.product.price + (i.variant?.price_adjustment ?? 0)
    return s + price * i.qty
  }, 0)

  return (
    <CartContext.Provider value={{ orgId, items, count, total, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCartContext must be used inside CartProvider")
  return ctx
}
