# Google OAuth Setup Guide

Google OAuth is currently **disabled** in the login/signup pages. To enable it:

## Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. For Application type, select **Web application**
7. Add authorized redirect URIs:
   ```
   https://ripghqeunlrnouvpgndy.supabase.co/auth/v1/callback
   ```
8. Copy the **Client ID** and **Client Secret**

## Step 2: Enable Google Provider in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ripghqeunlrnouvpgndy)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to expand
4. Toggle **Enable Google provider**
5. Paste your Google **Client ID** and **Client Secret**
6. Save changes

## Step 3: Re-enable Google Login Buttons

Once Google OAuth is configured in Supabase, you can re-add the Google login buttons:

### In `apps/platform-admin/app/login/page.tsx`:

Add this function before the `return` statement:
```typescript
async function handleGoogleLogin() {
  const res = await fetch(`${API}/auth/oauth/google`)
  const { url } = await res.json()
  window.location.href = url
}
```

Add this button in the CardContent (before the form):
```tsx
<Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
  <GoogleIcon />Continue with Google
</Button>
<div className="flex items-center gap-3">
  <Separator className="flex-1" />
  <span className="text-xs text-muted-foreground">or</span>
  <Separator className="flex-1" />
</div>
```

Add the GoogleIcon component at the bottom:
```tsx
function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
```

Don't forget to add the Separator import:
```typescript
import { Separator } from "@/components/ui/separator"
```

### Do the same for `apps/platform-admin/app/signup/page.tsx`

Replace `handleGoogleLogin` with `handleGoogleSignup` in the signup page.

## Testing

After completing all steps:
1. Restart your Next.js dev server
2. Try clicking "Continue with Google" on login/signup
3. You should be redirected to Google's OAuth consent screen
4. After authorizing, you'll be redirected back and logged in

## Notes

- OAuth users are automatically assigned the `end_user` role
- They can request role upgrades through the role request system
- The secret key field in signup only works for email/password signup
