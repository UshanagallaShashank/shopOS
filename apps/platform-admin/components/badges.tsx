// All badge components — plan, status, order status, user role
import { Badge } from "@/components/ui/badge"
import type { OrgStatus, PlanType, OrderStatus, UserRole } from "@/lib/types"

const PLAN_VARIANT: Record<PlanType, "secondary" | "default" | "outline"> = {
  starter: "secondary",
  pro: "default",
  enterprise: "outline",
}

const STATUS_VARIANT: Record<OrgStatus, "success" | "destructive" | "warning"> = {
  active: "success",
  suspended: "destructive",
  maintenance: "warning",
}

const ORDER_VARIANT: Record<OrderStatus, "secondary" | "warning" | "default" | "success" | "destructive"> = {
  pending: "secondary",
  confirmed: "warning",
  processing: "warning",
  shipped: "default",
  out_for_delivery: "default",
  delivered: "success",
  cancelled: "destructive",
  refunded: "destructive",
}

const ORDER_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

const ROLE_VARIANT: Record<UserRole, "default" | "outline" | "secondary" | "warning"> = {
  platform_admin: "default",
  orgs_manager: "outline",
  org_admin: "secondary",
  end_user: "secondary",
}

export function PlanBadge({ plan }: { plan: PlanType }) {
  return <Badge variant={PLAN_VARIANT[plan]}>{plan}</Badge>
}

export function StatusBadge({ status }: { status: OrgStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_VARIANT[status]}>{ORDER_LABEL[status]}</Badge>
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={ROLE_VARIANT[role]}>{role.replace("_", " ")}</Badge>
}
