# Login System Guide

## Overview

The application uses a simple, reliable localStorage-based authentication system with environment variable password storage.

## How It Works

1. **User enters password** on the login page
2. **Password is validated** against the `LOGIN` environment variable on the server
3. **Success:** `isAuthenticated` flag is set in localStorage
4. **Redirect** to the main application

## Environment Variable

The login password is stored in Vercel environment variable:

**Variable Name:** `LOGIN`  
**Current Value:** `2356`  
**Location:** Vercel Dashboard → Project Settings → Environment Variables

### How to Change Password

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Find the `LOGIN` variable
5. Click **Edit**
6. Enter new password
7. Click **Save**
8. **Redeploy** the application

## Security Model

This authentication system is designed for **internal team tools** where:

- Users are trusted team members
- Simple access control is sufficient
- Reliability is prioritized over maximum security
- No sensitive user data is stored

### Trade-offs

**Benefits:**
- ✅ Simple and reliable
- ✅ Works across all browsers
- ✅ Easy to debug
- ✅ No complex dependencies
- ✅ Password stored securely in environment variable

**Limitations:**
- ❌ No session expiry (user stays logged in until logout)
- ❌ No rate limiting on failed attempts
- ❌ localStorage can be cleared by user (just needs to login again)

## For Developers

### Login Flow

```
User → Login Page → Enter Password → POST /api/auth/login
                                            ↓
                                    Verify against LOGIN env var
                                            ↓
                                    Return success/failure
                                            ↓
                              Success: Set localStorage.isAuthenticated = 'true'
                                            ↓
                                    Redirect to homepage
```

### Authentication Check

```
Page Load → AuthProvider → Check localStorage.isAuthenticated
                                    ↓
                            'true' → Allow access
                            other  → Redirect to /login
```

### Logout Flow

```
User clicks Logout → Clear localStorage.isAuthenticated
                            ↓
                    Redirect to /login
```

### Files Involved

- **Login Form:** `src/components/auth/login-form.tsx`
- **Auth Provider:** `src/components/auth/auth-provider.tsx`
- **Login API:** `src/app/api/auth/login/route.ts`
- **Login Page:** `src/app/login/page.tsx`
- **Logout:** `src/components/auth/logout-button.tsx`

## Troubleshooting

### Issue: Can't login with correct password

**Check:**
1. Verify `LOGIN` environment variable is set in Vercel
2. Check if there are extra spaces in the password
3. Ensure latest deployment is active

**Solution:**
```bash
# Check environment variables
vercel env ls

# If needed, re-add the variable
vercel env add LOGIN production
```

### Issue: Logged out unexpectedly

**Cause:** localStorage was cleared (browser settings, private mode, etc.)

**Solution:** Just login again with the password

### Issue: Login works locally but not on Vercel

**Cause:** Environment variable not set on Vercel

**Solution:** Add `LOGIN` environment variable to Vercel (see "How to Change Password" above)

## Future Enhancements (Optional)

If you need more security in the future, consider:

- Session expiry (auto-logout after X hours)
- Rate limiting (max login attempts)
- Multi-user support with individual accounts
- Two-factor authentication
- Audit logs for login attempts

For now, the simple approach is sufficient for an internal team tool.

