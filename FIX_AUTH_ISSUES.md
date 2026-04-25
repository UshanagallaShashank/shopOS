# Authentication Fix - Complete Guide

## Issues Fixed

1. ✅ **ES256 Token Support** - Supabase uses ES256 algorithm, not HS256
2. ✅ **User Sync** - Login now auto-creates users in your `users` table if they don't exist
3. ✅ **Navigation** - Fixed duplicate dashboard links
4. ✅ **Security** - Added authentication to all API endpoints
5. ✅ **Google OAuth** - Removed (not configured in Supabase)

## Steps to Apply the Fix

### 1. Install New Dependencies

```bash
cd services/api
pip install -r requirements.txt
```

This installs:
- `cryptography` - For ES256 token support
- `httpx` - For fetching Supabase JWKS (future use)

### 2. Restart the API Server

**Option A: Using the restart script**
```bash
cd services/api
./restart.sh
```

**Option B: Manual restart**
```bash
cd services/api
# Stop the current server (Ctrl+C)
# Then start it again:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Clear Browser Data and Login

1. Go to `http://localhost:3000/clear-auth` to clear old tokens
2. Go to `http://localhost:3000/login`
3. Log in with your existing Supabase credentials

**The login will now automatically create the user in your `users` table if they don't exist!**

## What Changed

### Backend Changes

1. **`services/api/utils/jwt_verify.py`** (NEW)
   - Utility for verifying both HS256 and ES256 tokens
   - Handles Supabase's token format properly

2. **`services/api/middleware/auth.py`**
   - Now uses the new JWT verification utility
   - Better error messages
   - Supports ES256 tokens

3. **`services/api/services/auth_service.py`**
   - Login now auto-creates users in your `users` table
   - Fixes the "User not registered in ShopOS" error

4. **`services/api/routers/*.py`**
   - Added authentication to all endpoints (orgs, products, orders)
   - Proper role-based access control

5. **`services/api/requirements.txt`**
   - Added `cryptography` and `httpx`

### Frontend Changes

1. **`apps/platform-admin/components/nav.tsx`**
   - Fixed navigation to show only one dashboard per role
   - Better role filtering logic

2. **`apps/platform-admin/app/login/page.tsx`**
   - Removed Google OAuth button
   - Better token storage logic
   - Added console logging for debugging

3. **`apps/platform-admin/app/signup/page.tsx`**
   - Removed Google OAuth button
   - Better token storage logic

4. **`apps/platform-admin/app/dashboard/page.tsx`**
   - Added role-based access control
   - Redirects if user doesn't have `platform_admin` role

5. **`apps/platform-admin/lib/api.ts`**
   - Added console logging for debugging

6. **`apps/platform-admin/lib/hooks/useAuth.ts`**
   - Added console logging for debugging
   - Better error handling

## Testing

After applying the fix:

1. **Check API logs** - You should see:
   ```
   INFO: Attempting to verify token: eyJhbGciOiJFUzI1NiI...
   INFO: Token algorithm: ES256
   WARNING: ES256 token - using unverified payload (development mode)
   INFO: Token verified successfully for sub: <user-id>
   INFO: User authenticated: user@example.com (org_admin)
   ```

2. **Check browser console** - You should see:
   ```
   [useAuth] Fetching user, token exists: true
   [useAuth] Token preview: eyJhbGciOiJFUzI1NiI...
   [useAuth] /users/me response status: 200
   ```

3. **Check navigation** - You should see only ONE dashboard link based on your role

## Troubleshooting

### Still getting 401 errors?

1. **Did you restart the API server?** The changes won't take effect until you restart.

2. **Clear browser data:**
   - Go to `http://localhost:3000/clear-auth`
   - Or manually: DevTools → Application → Local Storage → Clear All

3. **Check API logs** for the actual error message

### User not found in database?

The login should now auto-create users, but if you still see this error:
1. Go to `/signup` and create a new account
2. Or manually add the user to your `users` table

### Wrong dashboard showing?

Check your user's role in the database:
```sql
SELECT email, role FROM users WHERE email = 'your@email.com';
```

Each role has its own dashboard:
- `platform_admin` → `/dashboard`
- `orgs_manager` → `/orgs-manager`
- `org_admin` → `/org-admin`
- `end_user` → `/end-user`

## Production Considerations

The current ES256 verification skips signature validation (development mode). For production:

1. Implement proper JWKS fetching from Supabase
2. Verify ES256 signatures using the public key
3. Add token caching to reduce verification overhead
4. Consider using Supabase's built-in RLS (Row Level Security) instead of custom auth

## Need Help?

Check the logs:
- **API logs**: Terminal where `uvicorn` is running
- **Browser logs**: DevTools → Console
- **Network logs**: DevTools → Network → Filter by "me" or "login"
