// Root layout — sidebar + main area, React Query provider, dark theme
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { Nav } from "@/components/nav"

export const metadata: Metadata = {
  title: "ShopOS Platform",
  description: "Platform admin dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Nav />
            <main className="flex-1 overflow-auto p-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
