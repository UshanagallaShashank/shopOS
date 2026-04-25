"use client"
// Root — redirects to the correct dashboard based on the user's role
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"

const ROLE_DASHBOARD: Record<string, string> = {
  platform_admin: "/dashboard",
  orgs_manager:   "/orgs-manager",
  org_admin:      "/org-admin",
  end_user:       "/end-user",
}

export default function Home() {
  const { shopUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const dest = shopUser ? (ROLE_DASHBOARD[shopUser.role] ?? "/dashboard") : "/login"
    router.replace(dest)
  }, [shopUser, loading])

  // Show nothing while resolving — middleware handles the actual auth guard
  return null
}
