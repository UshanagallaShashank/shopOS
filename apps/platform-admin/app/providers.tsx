"use client"
// React Query provider — wraps the whole app so any page can use useQuery/useMutation
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures one QueryClient per browser session, not recreated on render
  const [qc] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })
  )
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
