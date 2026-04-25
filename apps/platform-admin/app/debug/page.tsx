"use client"
// Debug page to check auth status and token
import { useAuth } from "@/lib/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const { shopUser, loading, getToken } = useAuth()
  const token = getToken()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Debug Info</h1>
        <p className="text-muted-foreground text-sm mt-1">Check your authentication status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : shopUser ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-mono text-sm">{shopUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-mono text-sm">{shopUser.role}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="font-mono text-sm">{shopUser.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Org ID</p>
                <p className="font-mono text-sm">{shopUser.org_id ?? "null"}</p>
              </div>
            </>
          ) : (
            <p className="text-destructive">Not logged in</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token</CardTitle>
        </CardHeader>
        <CardContent>
          {token ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Token (first 50 chars)</p>
              <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                {token.substring(0, 50)}...
              </p>
            </div>
          ) : (
            <p className="text-destructive">No token found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
