import { useState, useEffect, useCallback } from "react"
import type { Product } from "@/lib/types"

export type CartItem = { product: Product; qty: number }

export function useCart(orgId: string) {
  const key = `shopos_cart_${orgId}`

  const [items, setItems] = useState<CartItem[]>([])

  // Hydrate from localStorage after mount
  useEffect(() => {
    if (!orgId) return
    try {
      const stored = localStorage.getItem(key)
      if (stored) setItems(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [key, orgId])

  // Persist on every change
  useEffect(() => {
    if (!orgId) return
    localStorage.setItem(key, JSON.stringify(items))
  }, [items, key, orgId])

  const add = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, qty: Math.min(i.qty + 1, product.stock) }
            : i
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
    } else {
      setItems((prev) =>
        prev.map((i) => i.product.id === productId ? { ...i, qty } : i)
      )
    }
  }, [])

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((s, i) => s + i.qty, 0)
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0)

  return { items, count, total, add, setQty, remove, clear }
}
