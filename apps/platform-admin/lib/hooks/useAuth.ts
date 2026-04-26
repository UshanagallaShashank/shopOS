"use client"
// useAuth — reads token from localStorage, fetches ShopOS user profile
// No Supabase SDK — all auth goes through our backend
import { useEffect, useState, useCallback } from "react"
import type { UserRole } from "@/lib/types"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface ShopOSUser {
  id: string
  email: string | null
  role: UserRole
  org_id: string | null
}

export function useAuth() {
  const [shopUser, setShopUser] = useState<ShopOSUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    // Token stored by login/signup pages or OAuth callback
    const token = localStorage.getItem("shopos_token")
      ?? document.cookie.match(/shopos_token=([^;]+)/)?.[1]

    console.log("[useAuth] Fetching user, token exists:", !!token)
    if (token) {
      console.log("[useAuth] Token preview:", token.substring(0, 30) + "...")
    }

    if (!token) { setLoading(false); return }

    try {
      const res = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log("[useAuth] /users/me response status:", res.status)
      if (res.ok) {
        setShopUser(await res.json())
      } else {
        console.error("[useAuth] Failed to fetch user, removing token")
        localStorage.removeItem("shopos_token")
        document.cookie = "shopos_token=; max-age=0; path=/"
        setShopUser(null)
        if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.replace("/login")
        }
      }
    } catch (err) {
      console.error("[useAuth] Error fetching user:", err)
      setShopUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  function signOut() {
    console.log("[useAuth] Signing out...")
    
    // Clear localStorage
    localStorage.removeItem("shopos_token")
    
    // Clear all shopos_token cookies (try different paths)
    document.cookie = "shopos_token=; max-age=0; path=/; domain=" + window.location.hostname
    document.cookie = "shopos_token=; max-age=0; path=/"
    document.cookie = "shopos_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    
    // Clear any Supabase auth cookies
    const cookies = document.cookie.split(";")
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      if (name.includes("sb-") || name.includes("supabase")) {
        document.cookie = name + "=; max-age=0; path=/; domain=" + window.location.hostname
        document.cookie = name + "=; max-age=0; path=/"
      }
    }
    
    // Clear user state
    setShopUser(null)
    
    // Force a hard redirect to clear any cached state
    console.log("[useAuth] Redirecting to login...")
    window.location.replace("/login")
  }

  // Expose token so API calls can use it
  function getToken(): string | null {
    return localStorage.getItem("shopos_token")
      ?? document.cookie.match(/shopos_token=([^;]+)/)?.[1]
      ?? null
  }

  return { shopUser, loading, signOut, getToken }
}
