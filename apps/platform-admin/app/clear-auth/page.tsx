"use client"
// Clear auth page - removes all tokens and redirects to login
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClearAuthPage() {
  useEffect(() => {
    // Clear all auth tokens
    localStorage.removeItem("shopos_token")
    document.cookie = "shopos_token=; max-age=0; path=/"
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = "/login"
    }, 1000)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Clearing Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Removing old tokens and redirecting to login...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
