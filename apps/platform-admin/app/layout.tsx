// Root layout — conditionally shows sidebar based on route
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { ImprovedNav } from "@/components/improved-nav"
import { headers } from "next/headers"

export const metadata: Metadata = {
  title: "ShopOS Platform",
  description: "Platform admin dashboard",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the current path to decide whether to show the sidebar
  const headersList = await headers()
  const pathname = headersList.get("x-invoke-path") ?? ""
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/auth") || pathname.startsWith("/signup")

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <Providers>
          {isAuthPage ? (
            // Auth pages (login/signup) — full screen, no sidebar
            <>{children}</>
          ) : (
            // App pages — improved sidebar + main content
            <div className="flex h-screen overflow-hidden">
              <ImprovedNav />
              <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
            </div>
          )}
        </Providers>
      </body>
    </html>
  )
}
