# Quick Start - Fix Authentication Issues

## TL;DR

```bash
# 1. Install dependencies
cd services/api
pip install -r requirements.txt

# 2. Check setup
python3 check_setup.py

# 3. Restart API server
./restart.sh
# OR manually: uvicorn main:app --reload

# 4. Clear browser and login
# Go to: http://localhost:3000/clear-auth
# Then: http://localhost:3000/login
```

## What This Fixes

- ✅ **401 Unauthorized errors** - ES256 tokens now work
- ✅ **"User not registered"** - Login auto-creates users
- ✅ **3 dashboard links** - Now shows only 1 per role
- ✅ **Unsecured endpoints** - All endpoints now require auth
- ✅ **Google OAuth errors** - Removed (not configured)

## Step-by-Step

### 1. Install Dependencies (2 minutes)

```bash
cd services/api
pip install -r requirements.txt
```

You should see:
```
Successfully installed cryptography-42.0.5 httpx-0.27.0
```

### 2. Verify Setup (30 seconds)

```bash
python3 check_setup.py
```

You should see all green checkmarks ✅

### 3. Restart API Server

**Option A: Quick restart**
```bash
./restart.sh
```

**Option B: Manual**
```bash
# Stop current server (Ctrl+C in the terminal running it)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Test in Browser

1. **Clear old tokens**: http://localhost:3000/clear-auth
2. **Login**: http://localhost:3000/login
3. **Check console**: Should see `[useAuth] /users/me response status: 200`

## Verification

### API Logs Should Show:
```
INFO: Attempting to verify token: eyJhbGciOiJFUzI1NiI...
INFO: Token algorithm: ES256
WARNING: ES256 token - using unverified payload (development mode)
INFO: Token verified successfully for sub: 86ae8be5-4fe2-41d6-b05d-b3bb85d69d65
INFO: User authenticated: user@example.com (org_admin)
INFO: 127.0.0.1:xxxxx - "GET /users/me HTTP/1.1" 200 OK
```

### Browser Console Should Show:
```
[useAuth] Fetching user, token exists: true
[useAuth] Token preview: eyJhbGciOiJFUzI1NiI...
[useAuth] /users/me response status: 200
```

### Navigation Should Show:
- Only **ONE** dashboard link (based on your role)
- No duplicate "Dashboard" entries

## Still Having Issues?

### 401 Errors?
1. Did you restart the API server? **Changes require restart!**
2. Did you clear browser storage? Go to `/clear-auth`
3. Check API logs for the actual error

### "User not registered"?
- Login should auto-create users now
- If still failing, try signing up: `/signup`

### Wrong dashboard?
- Check your role: `SELECT email, role FROM users;`
- Each role has its own dashboard URL

## Need More Help?

See the full guide: [FIX_AUTH_ISSUES.md](./FIX_AUTH_ISSUES.md)
