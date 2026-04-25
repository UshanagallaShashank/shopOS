# How to Restart the API Server

## The Problem

You're seeing: `Invalid token: The specified alg value is not allowed`

This means **Python is using old cached bytecode**. The new code isn't being loaded.

## The Solution

### Option 1: Use the Restart Script (Recommended)

```bash
cd services/api
./restart.sh
```

This will:
1. Clear all Python cache (`__pycache__` directories)
2. Install/update dependencies
3. Kill any existing server process
4. Start a fresh server

### Option 2: Manual Restart

```bash
cd services/api

# 1. Clear Python cache
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# 2. Stop the current server
# Press Ctrl+C in the terminal where it's running
# OR: pkill -f "uvicorn main:app"

# 3. Start fresh
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Verify It's Working

### 1. Test JWT Utility

```bash
cd services/api
python3 test_jwt.py
```

You should see:
```
✅ Successfully decoded token
✅ Token verification logic works
✅ ALL TESTS PASSED
```

### 2. Check API Logs

After restarting, the logs should show:
```
INFO: Token algorithm: ES256
WARNING: ES256 token - using unverified payload (development mode)
INFO: Token verified successfully for sub: <user-id>
INFO: User authenticated: user@example.com (org_admin)
```

**NOT:**
```
Invalid token: The specified alg value is not allowed  ❌
```

### 3. Test in Browser

1. Clear browser: http://localhost:3000/clear-auth
2. Login: http://localhost:3000/login
3. Check console: Should see `200 OK` not `401`

## Still Not Working?

### Check 1: Is the server actually restarted?

```bash
# Check if old process is still running
ps aux | grep uvicorn

# Kill all uvicorn processes
pkill -9 -f uvicorn

# Start fresh
cd services/api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Check 2: Are dependencies installed?

```bash
cd services/api
pip install -r requirements.txt

# Should see:
# Successfully installed cryptography-42.0.5 httpx-0.27.0
```

### Check 3: Is the code correct?

```bash
cd services/api
python3 check_setup.py

# Should see all ✅ checkmarks
```

### Check 4: Python version

```bash
python3 --version

# Should be Python 3.8 or higher
```

## Common Mistakes

1. **Not clearing cache** - Python caches bytecode, old code keeps running
2. **Not actually restarting** - Ctrl+C might not kill the process
3. **Wrong directory** - Make sure you're in `services/api`
4. **Multiple processes** - Kill ALL uvicorn processes before restarting

## Nuclear Option

If nothing works, do a complete clean restart:

```bash
cd services/api

# 1. Kill everything
pkill -9 -f uvicorn
pkill -9 -f python

# 2. Clean everything
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
rm -rf .venv  # If using virtual environment

# 3. Fresh install
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 4. Start fresh
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Success Indicators

✅ API logs show: `Token algorithm: ES256`
✅ API logs show: `User authenticated: ...`
✅ Browser console shows: `200 OK`
✅ No more `401 Unauthorized` errors
✅ Dashboard loads correctly

## Need More Help?

1. Share the **complete API logs** (not just the error)
2. Run `python3 test_jwt.py` and share output
3. Run `python3 check_setup.py` and share output
4. Check if multiple Python processes are running: `ps aux | grep python`
