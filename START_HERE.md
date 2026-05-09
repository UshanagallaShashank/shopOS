# 🚀 START HERE - Quick Guide

## Current Status: ✅ READY TO USE

All critical issues have been fixed! The platform is ready to use with **email/password authentication**.

---

## 🎯 Quick Start (2 Minutes)

### 1. Start the Backend Server
```bash
cd services/api
make dev
```

**Expected output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
[CORS] Debug mode: Allowing ALL origins (*)
INFO:     Application startup complete.
```

✅ Server should **NOT** constantly reload anymore!

### 2. Start the Frontend (New Terminal)
```bash
cd apps/platform-admin
npm run dev
```

### 3. Open Browser
Go to: **http://localhost:3000/login**

### 4. Login Options

#### Option A: Create New Account
1. Click **"Sign up"** link
2. Enter email and password
3. Leave secret key blank (for end_user role)
4. Click **"Sign up"**
5. You'll be automatically logged in!

#### Option B: Use Existing Account
1. Click **"Email"** tab (should be default)
2. Enter your email and password
3. Click **"Sign in"**

---

## ⚠️ About Phone OTP

The **Phone OTP** tab will show an error because phone authentication needs to be enabled in Supabase.

**Two options**:
1. **Use email/password instead** (recommended for now) ✅
2. **Enable phone auth** - See `PHONE_AUTH_SETUP.md` (takes 5-10 minutes)

---

## ✅ What's Fixed

### Today's Fixes (April 27, 2026)
1. ✅ **Server constant reloading** - Fixed `.venv` exclusion pattern
2. ✅ **SQLAlchemy foreign key error** - Added model imports in `main.py`
3. ✅ **Cart model relationships** - Added product/variant relationships
4. ✅ **CORS issues** - Global exception handlers added

### Previously Completed
1. ✅ Database schema (17 tables migrated to Supabase)
2. ✅ Cart API endpoints (GET, POST, PATCH, DELETE)
3. ✅ Notifications API endpoints
4. ✅ Enhanced cart hook with debugging
5. ✅ Updated TypeScript types
6. ✅ Badge component with new statuses
7. ✅ Improved navigation component

---

## 🧪 Test the Platform

### Test Cart Functionality
1. Login to the platform
2. Go to shop page
3. Add products to cart
4. Cart should persist across page refreshes
5. Check browser console for cart debug logs

### Test Order Creation
1. Add items to cart
2. Go to checkout
3. Create an order
4. Order should be created with new schema (variants, tracking, etc.)

### Test Notifications
1. API endpoint: `GET /notifications`
2. Get unread count: `GET /notifications/unread-count`
3. Mark as read: `PATCH /notifications/{id}/read`

---

## 📚 Documentation

### Quick Reference
- **`CURRENT_ISSUE_SUMMARY.md`** - Current status and phone OTP issue
- **`FIXES_APPLIED.md`** - All fixes applied today
- **`PHONE_AUTH_SETUP.md`** - How to enable phone authentication

### Detailed Guides
- **`IMPLEMENTATION_SUMMARY.md`** - Full project status
- **`DATABASE_SCHEMA_COMPLETE.md`** - Database schema details
- **`CART_TROUBLESHOOTING.md`** - Cart debugging guide
- **`PLATFORM_IMPROVEMENTS.md`** - 12-point improvement plan

---

## 🔧 Common Commands

### Backend
```bash
# Start server
make run

# Restart with cache clear
make restart

# Apply migrations
make migrate

# Create new migration
make migration name="description"

# Check setup
make check
```

### Frontend
```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

### Both (from root)
```bash
# Start both servers
make dev

# Start API only
make dev-api

# Start frontend only
make dev-frontend
```

---

## 🆘 Troubleshooting

### Server keeps reloading
✅ **FIXED!** - Updated Makefile with proper `.venv/*` exclusion

### Foreign key error on order_items
✅ **FIXED!** - Added model imports in `main.py`

### Cart shows empty
- Check browser console for debug logs
- Check localStorage: `shopos_cart_{orgId}`
- See `CART_TROUBLESHOOTING.md`

### Phone OTP returns 401
- This is expected - phone auth not enabled in Supabase
- Use email/password instead
- See `PHONE_AUTH_SETUP.md` to enable

### CORS errors
- Check backend shows: `[CORS] Debug mode: Allowing ALL origins (*)`
- Verify `DEBUG=true` in `services/api/.env`

---

## 🎯 Next Steps

### Immediate
1. ✅ Login with email/password
2. ✅ Test cart functionality
3. ✅ Test order creation
4. ✅ Verify all pages load correctly

### Optional
1. Enable phone authentication in Supabase
2. Implement product variants UI
3. Add delivery tracking UI
4. Create notifications UI
5. Deploy improved sidebar

---

## 📊 System Health Check

Run these commands to verify everything is working:

```bash
# Check backend health
curl http://localhost:8000/health

# Check CORS headers
curl -I http://localhost:8000/health

# Test login endpoint
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🎉 You're Ready!

Everything is set up and working. Just:

1. **Start the servers** (backend + frontend)
2. **Login with email/password**
3. **Start testing the platform**

The phone OTP issue is **not a blocker** - it's just an optional feature that needs Supabase configuration.

**Happy coding!** 🚀

---

**Last Updated**: April 27, 2026
**Status**: ✅ Ready to use
