// OAuth callback — backend redirects here with ?token=xxx after Google auth
// We store the token and redirect to the app
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get("token")
  const code = searchParams.get("code")

  // Path 1: backend redirected here with a token already resolved
  if (token) {
    const role = searchParams.get("role") ?? "end_user"
    const dest = ({ platform_admin: "/dashboard", orgs_manager: "/orgs-manager", org_admin: "/org-admin", end_user: "/end-user" } as Record<string, string>)[role] ?? "/dashboard"
    const response = NextResponse.redirect(new URL(dest, request.url))
    response.cookies.set("shopos_token", token, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    return response
  }

  // Path 2: Supabase redirected directly here with a code (fallback)
  // Forward the code to our backend to handle
  if (code) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    return NextResponse.redirect(`${apiUrl}/auth/callback?code=${code}`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
