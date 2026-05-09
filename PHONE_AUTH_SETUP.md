# Phone Authentication Setup Guide

## Issue: 401 Unauthorized - "Unsupported phone provider"

**Error**: `Could not send OTP: Unsupported phone provider`

**Root Cause**: Phone authentication is not enabled in your Supabase project.

---

## ✅ Solution: Enable Phone Auth in Supabase

### Step 1: Enable Phone Provider in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `ripghqeunlrnouvpgndy`
3. Navigate to: **Authentication** → **Providers**
4. Find **Phone** in the list of providers
5. Click **Enable** or toggle it ON
6. Configure the phone provider settings

---

### Step 2: Configure Twilio for SMS (Required)

Supabase uses Twilio to send SMS messages. You need to configure Twilio:

#### Option A: Use Supabase's Built-in Twilio (Recommended for Testing)
1. In Supabase Dashboard → **Authentication** → **Providers** → **Phone**
2. Select **"Use Supabase's Twilio"** (limited free tier for testing)
3. This is the easiest option for development

#### Option B: Use Your Own Twilio Account (Production)
1. Create a Twilio account: https://www.twilio.com/try-twilio
2. Get your credentials from Twilio Console:
   - Account SID
   - Auth Token
   - Phone Number (must be verified/purchased)
3. In Supabase Dashboard → **Authentication** → **Providers** → **Phone**
4. Select **"Use your own Twilio credentials"**
5. Enter:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Phone Number (E.164 format: +15551234567)

---

### Step 3: Configure Phone Auth Settings

In Supabase Dashboard → **Authentication** → **Providers** → **Phone**:

1. **Enable Phone Signup**: ✅ ON
2. **Enable Phone Login**: ✅ ON
3. **OTP Expiry**: 60 seconds (default)
4. **OTP Length**: 6 digits (default)
5. **Template** (optional): Customize SMS message
   ```
   Your ShopOS verification code is: {{ .Token }}
   ```

---

### Step 4: Configure Rate Limiting (Optional but Recommended)

To prevent abuse:

1. Go to **Authentication** → **Rate Limits**
2. Set limits for phone OTP:
   - **Max requests per hour**: 5-10 per phone number
   - **Max requests per IP**: 20-30 per hour

---

### Step 5: Test Phone Authentication

After enabling phone auth in Supabase:

1. **Restart your backend server**:
   ```bash
   cd services/api
   make restart
   ```

2. **Test the endpoint**:
   ```bash
   curl -X POST http://localhost:8000/auth/phone/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919876543210"}'
   ```

3. **Expected response**:
   ```json
   {"message": "OTP sent"}
   ```

4. **Check your phone** for the SMS with OTP code

5. **Verify the OTP**:
   ```bash
   curl -X POST http://localhost:8000/auth/phone/verify \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919876543210", "token": "123456"}'
   ```

---

## 📱 Phone Number Format

The API automatically normalizes phone numbers:

- **Input**: `9876543210` → **Output**: `+919876543210` (adds +91 for India)
- **Input**: `+919876543210` → **Output**: `+919876543210` (keeps as is)
- **Input**: `919876543210` → **Output**: `+919876543210` (adds +)
- **Input**: `09876543210` → **Output**: `+919876543210` (removes leading 0, adds +91)

For other countries, use full international format: `+1234567890`

---

## 🔧 Alternative: Use Email/Password Auth Instead

If you don't want to set up phone auth right now, you can use email/password authentication:

### Frontend Login Page
Update `apps/platform-admin/app/login/page.tsx` to use email/password:

```typescript
const handleLogin = async () => {
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });
  
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.access_token);
    router.push('/dashboard');
  }
};
```

### Frontend Signup Page
Update `apps/platform-admin/app/signup/page.tsx`:

```typescript
const handleSignup = async () => {
  const response = await fetch('http://localhost:8000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
      phone: phone, // optional
      secret_key: "" // empty = end_user role
    })
  });
  
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.access_token);
    router.push('/dashboard');
  }
};
```

---

## 🚨 Common Issues

### Issue 1: "Phone provider not enabled"
**Solution**: Enable Phone provider in Supabase Dashboard → Authentication → Providers

### Issue 2: "Twilio credentials invalid"
**Solution**: 
- Verify Twilio Account SID and Auth Token
- Ensure phone number is in E.164 format (+15551234567)
- Check Twilio account is active and has credits

### Issue 3: "SMS not received"
**Solution**:
- Check phone number is correct
- Verify Twilio phone number is verified
- Check Twilio logs for delivery status
- Try a different phone number
- Check spam/blocked messages

### Issue 4: "Rate limit exceeded"
**Solution**:
- Wait before trying again
- Adjust rate limits in Supabase Dashboard
- Use different phone number for testing

---

## 📊 Current Status

### ✅ Working
- Email/Password authentication
- OAuth authentication (Google, GitHub, etc.)
- JWT token verification
- User roles (platform_admin, org_admin, end_user)

### ⚠️ Needs Configuration
- **Phone authentication** - Requires Supabase Phone provider setup
- **SMS notifications** - Requires Twilio configuration in `.env`
- **Email notifications** - Requires Resend API key (already in `.env`)

---

## 🔐 Security Notes

1. **Never expose service_role key** to frontend
2. **Use rate limiting** to prevent OTP spam
3. **Validate phone numbers** before sending OTP
4. **Set OTP expiry** to 60-120 seconds
5. **Limit OTP attempts** to 3-5 per phone number

---

## 📞 Next Steps

1. **Enable Phone Auth in Supabase** (5 minutes)
2. **Configure Twilio** (10 minutes if using own account)
3. **Test OTP flow** (2 minutes)
4. **Update frontend** to use phone auth (optional)

---

## 🎯 Quick Fix for Development

If you want to skip phone auth for now:

1. **Use email/password auth** instead (already working)
2. **Create test users** via signup endpoint
3. **Login with email/password** to get access token
4. **Enable phone auth later** when ready for production

---

**Status**: Phone auth endpoint is working, but Supabase phone provider needs to be enabled ✅

**Last Updated**: April 27, 2026
