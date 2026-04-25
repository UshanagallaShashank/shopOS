// Middleware — checks for shopos_token cookie to protect routes
// No Supabase SDK needed — token is set by our backend auth flow
import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("shopos_token")?.value
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith("/login")
    || pathname.startsWith("/signup")
    || pathname.startsWith("/auth")

  // Not logged in + protected page → login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Already logged in + auth page → home (redirects to correct dashboard)
  if (token && isAuthPage && !pathname.startsWith("/auth/callback")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
