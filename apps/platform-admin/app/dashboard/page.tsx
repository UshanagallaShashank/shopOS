"use client"
// Dashboard — live stats computed from org data, recent orgs list
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { api } from "@/lib/api"
import type { Org } from "@/lib/types"

export default function DashboardPage() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.orgs.list(),
  })

  const active = orgs.filter((o) => o.status === "active").length
  const suspended = orgs.filter((o) => o.status === "suspended").length

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-6">Platform overview</p>

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Stat label="Total Orgs" value={orgs.length} />
            <Stat label="Active" value={active} color="green" />
            <Stat label="Suspended" value={suspended} color="red" />
          </div>
          <RecentOrgs orgs={orgs.slice(0, 5)} />
        </>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: "green" | "red" }) {
  const textColor = color === "green" ? "text-green-400" : color === "red" ? "text-red-400" : "text-white"
  return (
    <div className="bg-[#1A1A2E] rounded-xl p-5 border border-white/5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${textColor}`}>{value}</p>
    </div>
  )
}

function RecentOrgs({ orgs }: { orgs: Org[] }) {
  return (
    <div>
      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Recent Orgs</h2>
      <div className="space-y-2">
        {orgs.length === 0 && (
          <p className="text-gray-500 text-sm">
            No orgs yet.{" "}
            <Link href="/orgs/new" className="text-[#E94560] hover:underline">Create one →</Link>
          </p>
        )}
        {orgs.map((org) => (
          <Link
            key={org.id}
            href={`/orgs/${org.id}`}
            className="bg-[#1A1A2E] rounded-lg px-4 py-3 flex justify-between items-center border border-white/5 hover:border-white/10 transition-colors block"
          >
            <div>
              <p className="font-medium text-sm">{org.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{org.slug}.shopOS.in</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${org.status === "active" ? "text-green-400 bg-green-900/30" : "text-red-400 bg-red-900/30"}`}>
              {org.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
