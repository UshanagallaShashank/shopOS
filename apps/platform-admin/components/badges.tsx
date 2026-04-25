// Plan and status badges — reused in org table, detail page, and dashboard
import type { OrgStatus, PlanType } from "@/lib/types"

const PLAN: Record<PlanType, string> = {
  starter: "bg-gray-700 text-gray-200",
  pro: "bg-blue-900 text-blue-200",
  enterprise: "bg-purple-900 text-purple-200",
}

const STATUS: Record<OrgStatus, string> = {
  active: "bg-green-900/50 text-green-300",
  suspended: "bg-red-900/50 text-red-300",
  maintenance: "bg-yellow-900/50 text-yellow-300",
}

export function PlanBadge({ plan }: { plan: PlanType }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${PLAN[plan]}`}>
      {plan}
    </span>
  )
}

export function StatusBadge({ status }: { status: OrgStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS[status]}`}>
      {status}
    </span>
  )
}
