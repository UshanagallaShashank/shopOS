// Token helpers — store/read/clear the auth token consistently
// Cookie = read by middleware (server-side), localStorage = read by API calls (client-side)

export function setToken(token: string) {
  localStorage.setItem("shopos_token", token)
  // 7-day cookie — middleware reads this to protect routes
  document.cookie = `shopos_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("shopos_token")
    ?? document.cookie.match(/shopos_token=([^;]+)/)?.[1]
    ?? null
}

export function clearToken() {
  localStorage.removeItem("shopos_token")
  document.cookie = "shopos_token=; path=/; max-age=0"
}
