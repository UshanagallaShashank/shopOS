"use client"
// Org detail — shows org info, plan/status badges, and the products table
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { PlanBadge, StatusBadge } from "@/components/badges"

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: org, isLoading } = useQuery({
    queryKey: ["orgs", id],
    queryFn: () => api.orgs.get(id),
  })

  const { data: products = [] } = useQuery({
    queryKey: ["products", id],
    queryFn: () => api.products.list(id),
    enabled: !!id,
  })

  const deleteOrg = useMutation({
    mutationFn: () => api.orgs.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orgs"] }); router.push("/orgs") },
  })

  if (isLoading) return <p className="text-gray-400 text-sm">Loading...</p>
  if (!org) return <p className="text-red-400 text-sm">Org not found.</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/orgs" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">← All Orgs</Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{org.slug}.shopOS.in</p>
          </div>
          <button
            onClick={() => { if (confirm(`Delete "${org.name}"?`)) deleteOrg.mutate() }}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Delete Org
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <InfoCard label="Plan"><PlanBadge plan={org.plan} /></InfoCard>
        <InfoCard label="Status"><StatusBadge status={org.status} /></InfoCard>
        <InfoCard label="Created">
          <span className="text-sm">{new Date(org.created_at).toLocaleDateString("en-IN")}</span>
        </InfoCard>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">
            Products <span className="text-gray-400 font-normal text-sm">({products.length})</span>
          </h2>
          <Link href={`/orgs/${id}/products/new`} className="text-sm bg-[#E94560] hover:bg-[#d63050] px-3 py-1.5 rounded-lg transition-colors">
            + Add Product
          </Link>
        </div>

        <div className="bg-[#1A1A2E] rounded-xl border border-white/5 overflow-hidden">
          {products.length === 0 ? (
            <p className="text-gray-400 p-5 text-sm">No products yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr>
                  {["Name", "Price", "Stock", "Category", "Active"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">₹{Number(p.price).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3 text-gray-400">{p.category ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={p.is_active ? "text-green-400" : "text-gray-500"}>{p.is_active ? "Yes" : "No"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1A2E] rounded-xl p-4 border border-white/5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  )
}
