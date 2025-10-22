# Admin Bootstrap Guide

## Overview

The admin bootstrap feature allows you to create the first admin account **without SMS verification**. This is useful when:

- Twilio blocks your region (e.g., +852 Hong Kong due to fraud prevention)
- You need to set up the system before verifying your Twilio account
- SMS service is temporarily unavailable

## How It Works

Instead of receiving an SMS code, the admin uses a **secure bootstrap code** stored in environment variables to create their account directly.

## Setup

### 1. Set Environment Variables

Add these to your Vercel project (or `.env.local` for local development):

```bash
ADMIN_BOOTSTRAP_PHONE="+85266244432"  # Admin phone number (E.164 format or 8-digit HK)
ADMIN_BOOTSTRAP_CODE="EasyHealth2025Admin"  # Your secure bootstrap code
```

**Important:**
- Use a **strong, unique code** (at least 20 characters recommended)
- Keep it secret - only share with the person setting up the first admin
- You can change it after the first admin is created

### 2. Deploy

After setting environment variables in Vercel, trigger a deployment:

```bash
git commit --allow-empty -m "trigger redeploy for env vars"
git push origin main
```

## Usage

### Step 1: Go to Login Page

Navigate to your app's login page: `https://your-app.vercel.app/login`

### Step 2: Click "管理員啟動模式"

At the bottom of the phone number input form, click the **"管理員啟動模式"** (Admin Bootstrap Mode) button.

### Step 3: Enter Credentials

- **管理員電話號碼**: Enter your phone number (e.g., `66244432` for Hong Kong)
- **啟動碼**: Enter your bootstrap code (e.g., `EasyHealth2025Admin`)

### Step 4: Submit

Click **"啟動管理員帳號"** to create your admin account.

You'll be immediately logged in and redirected to the home page.

## Security

### Protection Mechanisms

1. **Phone Number Validation**
   - Only the phone number in `ADMIN_BOOTSTRAP_PHONE` can use this feature
   - Other phone numbers will be rejected with "此功能僅適用於管理員帳號"

2. **Code Verification**
   - Uses timing-safe comparison to prevent timing attacks
   - Wrong code returns "啟動碼錯誤"

3. **One-Time Admin Creation**
   - If an admin already exists for this phone number, returns "管理員帳號已存在，請使用一般登入"
   - Prevents accidental re-creation

4. **Full Audit Logging**
   - All bootstrap attempts are logged (success and failure)
   - Includes IP, user agent, and metadata

## After Bootstrap

### Adding Other Users

Once your admin account is created, you can add other users through the Admin UI:

1. Go to **系統管理** (System Management)
2. Click **用戶管理** (User Management)
3. Add new phone numbers
4. Assign roles (Employee, Manager, Admin)

### Regular Login

After bootstrap, your admin account should use the **regular OTP login** (when Twilio allows SMS to your region).

The bootstrap endpoint will reject requests if the admin already exists.

## Troubleshooting

### "Admin bootstrap not configured"

**Cause**: `ADMIN_BOOTSTRAP_CODE` or `ADMIN_BOOTSTRAP_PHONE` not set in environment variables.

**Solution**: Add both variables to Vercel and redeploy.

### "此功能僅適用於管理員帳號"

**Cause**: The phone number you entered doesn't match `ADMIN_BOOTSTRAP_PHONE`.

**Solution**: 
- Check that you're using the correct phone number
- Verify `ADMIN_BOOTSTRAP_PHONE` in Vercel matches your number
- Remember: 8-digit HK numbers are auto-prefixed with +852

### "啟動碼錯誤"

**Cause**: Wrong bootstrap code.

**Solution**: 
- Check `ADMIN_BOOTSTRAP_CODE` in Vercel
- Copy-paste to avoid typos
- Code is case-sensitive

### "管理員帳號已存在，請使用一般登入"

**Cause**: Admin account already created for this phone number.

**Solution**: Use the regular OTP login instead (click "返回一般登入").

## Best Practices

### 1. Strong Bootstrap Code

Use a strong, unique code:

```bash
# Good ✅
ADMIN_BOOTSTRAP_CODE="EasyHealth2025!Admin#Setup$Secure"

# Bad ❌
ADMIN_BOOTSTRAP_CODE="1234"
ADMIN_BOOTSTRAP_CODE="admin"
```

### 2. Rotate After Setup

After creating the first admin:

1. Change `ADMIN_BOOTSTRAP_CODE` in Vercel
2. Store the new code securely
3. This prevents future unauthorized bootstrap attempts

### 3. Use Regular OTP When Possible

The bootstrap is a **workaround** for when SMS is blocked. Once Twilio allows your region:

1. Verify your phone number in Twilio Console
2. Upgrade Twilio account if needed
3. Use regular OTP login for better security

### 4. Monitor Audit Logs

Check the **審計日誌** (Audit Logs) in Admin UI to see:
- Failed bootstrap attempts (potential security issue)
- Who logged in and when
- All system activity

## Technical Details

### API Endpoint

**POST** `/api/auth/admin-bootstrap`

**Request Body:**
```json
{
  "phone": "66244432",
  "bootstrapCode": "EasyHealth2025Admin"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "role": "ADMIN",
    "message": "管理員帳號已創建"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "啟動碼錯誤"
}
```

### Security Implementation

- **Timing-safe comparison** prevents timing attacks on bootstrap code
- **Phone normalization** handles both E.164 (+85212345678) and local (12345678) formats
- **Audit logging** records all attempts with IP and user agent
- **Session cookies** are httpOnly, secure (in production), and sameSite=lax

### Database Changes

On successful bootstrap, creates or updates:

1. **User record**
   - phoneE164: normalized phone
   - role: ADMIN

2. **Session record**
   - userId: user ID
   - expiresAt: 12 hours from now
   - IP and user agent tracked

3. **Audit log**
   - action: LOGIN_SUCCESS
   - metadata: { method: 'admin_bootstrap' }

## FAQ

**Q: Can I use this for regular employees?**

A: No, this feature is only for the phone number specified in `ADMIN_BOOTSTRAP_PHONE`. Regular employees must use OTP login.

**Q: What if I forget the bootstrap code?**

A: Check your Vercel environment variables. If you don't have access, ask the person who set up the project.

**Q: Can I change the admin phone number?**

A: Yes, update `ADMIN_BOOTSTRAP_PHONE` in Vercel and redeploy. The old admin account will still exist but won't be able to use bootstrap anymore.

**Q: Is this less secure than OTP?**

A: The bootstrap is **equally secure** if you use a strong code and keep it secret. However, OTP is preferred because:
- Codes are one-time use
- No shared secret to protect
- User's phone is the authentication factor

**Q: When will regular OTP work for Hong Kong?**

A: You need to:
1. Verify your Twilio account (identity verification)
2. Add credit card and billing information
3. Request unblocking of +852 prefix in Twilio Console
4. Upgrade from trial to paid account (if on trial)

Contact Twilio support for assistance: https://www.twilio.com/console/support

