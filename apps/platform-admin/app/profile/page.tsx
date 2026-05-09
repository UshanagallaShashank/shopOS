"use client"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  User, Package, ShoppingCart, Star, Heart,
  MapPin, Phone, Mail, CalendarDays, BadgeCheck,
  TrendingUp, CheckCircle2, Clock, Truck,
} from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ProfilePage() {
  const { shopUser, updatePhone } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [displayName, setDisplayName] = useState(shopUser?.email?.split("@")[0] ?? "")
  const [phone, setPhone] = useState(shopUser?.phone ?? "")

  useEffect(() => {
    if (shopUser?.phone) setPhone(shopUser.phone)
  }, [shopUser?.phone])

  const { data: myOrders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.orders.my(),
  })
  const { data: myOrgs = [] } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => api.users.myOrgs(),
  })

  const totalSpent = myOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0)
  const activeOrders = myOrders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status))
  const deliveredOrders = myOrders.filter(o => o.status === "delivered")

  const STATUS_COLOR: Record<string, string> = {
    pending: "text-orange-400", confirmed: "text-blue-400", processing: "text-blue-400",
    shipped: "text-violet-400", out_for_delivery: "text-violet-400",
    delivered: "text-green-400", cancelled: "text-muted-foreground", refunded: "text-muted-foreground",
  }
  const STATUS_LABEL: Record<string, string> = {
    pending: "Pending", confirmed: "Confirmed", processing: "Processing",
    shipped: "Shipped", out_for_delivery: "Out for Delivery",
    delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
  }

  async function handleSave() {
    if (phone) await updatePhone(phone)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-2xl bg-primary/15 border-2 border-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                {shopUser?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Display Name</label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Phone</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-8 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold">{displayName || shopUser?.email?.split("@")[0]}</h2>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{shopUser?.email}</span>
                        {phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{phone}</span>}
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Joined ShopOS
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={() => setEditing(true)}>
                      Edit Profile
                    </Button>
                  </div>
                  {saved && <p className="text-xs text-green-400 flex items-center gap-1 mt-2"><CheckCircle2 className="h-3.5 w-3.5" />Profile saved!</p>}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ShoppingCart, label: "Total Orders", value: myOrders.length, color: "text-primary", bg: "bg-primary/10" },
          { icon: Truck, label: "Active", value: activeOrders.length, color: "text-violet-400", bg: "bg-violet-500/10" },
          { icon: CheckCircle2, label: "Delivered", value: deliveredOrders.length, color: "text-green-400", bg: "bg-green-500/10" },
          { icon: TrendingUp, label: "Total Spent", value: totalSpent >= 1000 ? `₹${(totalSpent/1000).toFixed(1)}k` : `₹${totalSpent}`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
            <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-1.5`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* My shops */}
      {myOrgs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">My Shops ({myOrgs.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {myOrgs.map(org => (
              <Link key={org.id} href={`/shop/${org.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-accent/40 transition-all">
                {org.logo ? (
                  <img src={org.logo} alt={org.name} className="h-9 w-9 rounded-lg object-cover border border-border shrink-0" />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    {org.name[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  {org.category && <p className="text-xs text-muted-foreground">{org.category}</p>}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent orders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Recent Orders</CardTitle>
            <Link href="/end-user" className="text-xs text-primary hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardContent>
          {myOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Package className="h-8 w-8 text-muted-foreground/25" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <Link href="/shop"><Button size="sm" variant="outline">Browse Shops</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myOrders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/40">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-medium">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className="font-bold text-sm shrink-0">₹{Number(order.total).toLocaleString("en-IN")}</p>
                  <span className={`text-xs font-semibold shrink-0 ${STATUS_COLOR[order.status] ?? "text-muted-foreground"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
