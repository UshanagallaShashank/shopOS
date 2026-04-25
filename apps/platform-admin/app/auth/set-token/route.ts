// Sets the auth token as a cookie server-side.
// Called by the login page after receiving a token from the backend.
// Returns JSON (not a redirect) so the login page controls the navigation.
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { token } = await request.json()

  const response = NextResponse.json({ ok: true })

  response.cookies.set("shopos_token", token, {
    httpOnly: false,   // must be readable by JS for Authorization headers
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return response
}
