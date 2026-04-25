"use client"
// Providers — wraps the app with React Query
// Supabase auth state is handled per-component via useAuth hook
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session — not recreated on every render
  const [qc] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
    })
  )
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
