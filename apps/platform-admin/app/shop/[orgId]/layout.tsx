import { CartProvider } from "@/components/cart-context"

export default function ShopOrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgId: string }
}) {
  return <CartProvider orgId={params.orgId}>{children}</CartProvider>
}
