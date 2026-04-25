"use client"
// Orgs list — click a row to open the org detail page
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PlanBadge, StatusBadge } from "@/components/badges"
import { api } from "@/lib/api"

export default function OrgsPage() {
  const router = useRouter()
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.orgs.list(),
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orgs</h1>
          <p className="text-gray-400 text-sm mt-0.5">{orgs.length} shops on the platform</p>
        </div>
        <Link
          href="/orgs/new"
          className="bg-[#E94560] hover:bg-[#d63050] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Org
        </Link>
      </div>

      <div className="bg-[#1A1A2E] rounded-xl border border-white/5 overflow-hidden">
        {isLoading && <p className="text-gray-400 p-6 text-sm">Loading...</p>}
        {!isLoading && orgs.length === 0 && (
          <p className="text-gray-400 p-6 text-sm">
            No orgs yet.{" "}
            <Link href="/orgs/new" className="text-[#E94560]">Create one →</Link>
          </p>
        )}
        {orgs.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr>
                {["Name", "Slug", "Plan", "Status", "Created"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orgs.map((org) => (
                <tr
                  key={org.id}
                  onClick={() => router.push(`/orgs/${org.id}`)}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-medium">{org.name}</td>
                  <td className="px-5 py-3 text-gray-400">{org.slug}</td>
                  <td className="px-5 py-3"><PlanBadge plan={org.plan} /></td>
                  <td className="px-5 py-3"><StatusBadge status={org.status} /></td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(org.created_at).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
