"use client"
// Sidebar nav — highlights active route, used in root layout
import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orgs", label: "Orgs" },
]

export function Nav() {
  const path = usePathname()
  return (
    <aside className="w-52 bg-[#1A1A2E] flex flex-col border-r border-white/5 shrink-0">
      <div className="p-5 border-b border-white/5">
        <span className="text-lg font-bold tracking-tight">
          Shop<span className="text-[#E94560]">OS</span>
        </span>
        <p className="text-xs text-gray-500 mt-0.5">Platform Admin</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {LINKS.map(({ href, label }) => {
          const active = path === href || path.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-[#E94560] text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
