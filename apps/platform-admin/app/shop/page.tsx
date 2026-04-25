"use client"
// Shop landing — if end user has one org, go straight there; otherwise show org picker
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Store, Package, ArrowRight, ShoppingBag } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/hooks/useAuth"
import { PlanBadge } from "@/components/badges"

export default function ShopPage() {
  const { shopUser } = useAuth()
  const router = useRouter()

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => api.users.myOrgs(),
    enabled: !!shopUser,
  })

  // Single org: skip the picker and go straight to the shop
  useEffect(() => {
    if (!isLoading && orgs.length === 1) {
      router.replace(`/shop/${orgs[0].id}`)
    }
  }, [orgs, isLoading])

  // While redirecting or loading, show nothing
  if (isLoading || orgs.length === 1) return null

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <Store className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">My Shops</h1>
          <p className="text-muted-foreground text-sm">Pick a store to browse</p>
        </div>
      </div>

      {orgs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border border-dashed border-border">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
          <div className="text-center space-y-1">
            <p className="font-medium">No shops available</p>
            <p className="text-sm text-muted-foreground">
              You haven't been granted access to any shops yet.
              Contact a platform admin to get access.
            </p>
          </div>
        </div>
      )}

      {orgs.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/shop/${org.id}`}
              className="group rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{org.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{org.slug}.shopOS.in</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
              <div className="flex items-center justify-between">
                <PlanBadge plan={org.plan} />
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />Browse products
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
