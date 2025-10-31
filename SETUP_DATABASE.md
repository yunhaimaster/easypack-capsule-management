# DATABASE CONNECTION ERROR - SETUP GUIDE

## 🚨 Critical Issue Identified

Your application is experiencing database connection errors because **`DATABASE_URL` is not configured**.

**Error Message:**
```
PrismaClientInitializationError: Can't reach database server at `db.prisma.io:5432`
```

This means Prisma is using a **placeholder URL** because no real database connection is configured.

---

## ✅ IMMEDIATE FIX REQUIRED

### Step 1: Configure Database URL

You have **3 options** to set up your database:

#### **Option A: Use Existing PostgreSQL Database (Recommended)**

If you already have a PostgreSQL database:

1. Open `.env.local` file (created for you)
2. Replace this line:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/easypack_dev?schema=public"
   ```
   
   With your actual database connection string:
   ```
   DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:5432/YOUR_DATABASE?schema=public"
   ```

3. Save the file

#### **Option B: Use Vercel Postgres (If Using Vercel)**

1. Go to [Vercel Dashboard](https://vercel.com)
2. Navigate to: **Your Project → Storage → Create Database → Postgres**
3. Copy the connection string
4. Open `.env.local` and update:
   ```
   POSTGRES_PRISMA_URL="your-vercel-postgres-connection-string"
   ```

#### **Option C: Set Up Local PostgreSQL (For Development)**

**On macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb easypack_dev
```

**On Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb easypack_dev
```

**On Windows:**
- Download and install from [PostgreSQL.org](https://www.postgresql.org/download/windows/)
- Use pgAdmin to create database `easypack_dev`

Then update `.env.local`:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/easypack_dev?schema=public"
```

---

### Step 2: Configure Other Required Variables

Open `.env.local` and also configure:

#### **A. Session Secret (REQUIRED)**
Generate a secure random key:
```bash
openssl rand -hex 32
```

Copy the output and paste it:
```
SESSION_SECRET="paste-generated-key-here"
```

#### **B. Twilio (REQUIRED for OTP Authentication)**
If using phone authentication:
```
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_VERIFY_SERVICE_SID="your_verify_service_sid"
```

Get these from: https://console.twilio.com/

#### **C. OpenRouter AI (REQUIRED for AI Features)**
If using AI features (granulation analyzer, recipe generator):
```
OPENROUTER_API_KEY="your_openrouter_api_key"
```

Get this from: https://openrouter.ai/keys

---

### Step 3: Run Database Migrations

After configuring `DATABASE_URL`:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# Verify connection
npx prisma db pull
```

If migrations fail, check:
- Database is running
- Connection string is correct
- User has CREATE TABLE permissions

---

### Step 4: Start Development Server

```bash
npm run dev
```

You should see:
```
✅ Database configuration validated
```

If you see this error:
```
⚠️  DATABASE_URL is not defined
```
→ Go back to Step 1 and configure DATABASE_URL properly.

---

## 🔧 Technical Changes Made

I've already fixed the following issues in your codebase:

### 1. Fixed Singleton Pattern Violations
**Before (causing connection exhaustion):**
```typescript
// ❌ Creating multiple Prisma instances
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
await prisma.$disconnect()
```

**After (using singleton):**
```typescript
// ✅ Using singleton instance
import { prisma } from '@/lib/prisma'
// No disconnect needed
```

**Files Fixed:**
- `src/app/api/migrate-simple/route.ts`
- `src/app/api/migrate-prisma/route.ts`
- `src/app/api/migrate/route.ts`

### 2. Added Database Validation
Enhanced `src/lib/prisma.ts` with:
- Startup validation for DATABASE_URL
- Detection of placeholder URLs
- Clear error messages
- Production safety checks

### 3. Created Environment Template
Created `.env.local` with all required variables documented.

---

## 🧪 Testing the Fix

After completing setup:

### Test 1: Verify Database Connection
```bash
npm run dev
```
Expected output:
```
✅ Database configuration validated
Ready on http://localhost:3000
```

### Test 2: Test Work Order Operations
1. Navigate to work orders page
2. Create or link a production order with a worker
3. Verify no connection errors occur
4. Check console logs for "Database configuration validated"

### Test 3: Check Error Handling
1. Temporarily stop your database
2. Try to perform an operation
3. Verify you see a user-friendly error (not a crash)
4. Start database again
5. Retry operation - should work (automatic reconnection)

---

## 🚀 Production Deployment

### For Vercel

1. **Set Environment Variables:**
   - Go to: Vercel Dashboard → Project → Settings → Environment Variables
   - Add:
     - `DATABASE_URL` or `POSTGRES_PRISMA_URL`
     - `SESSION_SECRET`
     - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
     - `OPENROUTER_API_KEY`

2. **Deploy:**
   ```bash
   vercel deploy --prod
   ```

3. **Verify:**
   - Check deployment logs for "✅ Database configuration validated"
   - Test work order operations in production

### For Other Platforms

Ensure all environment variables from `.env.local` are configured in your hosting platform's environment settings.

---

## 📋 Checklist

Before marking this as resolved:

- [ ] `.env.local` file exists with valid `DATABASE_URL`
- [ ] `SESSION_SECRET` is configured (min 32 characters)
- [ ] Twilio credentials configured (if using OTP)
- [ ] OpenRouter API key configured (if using AI)
- [ ] `npx prisma generate` runs successfully
- [ ] `npx prisma migrate deploy` runs successfully
- [ ] `npm run dev` shows "✅ Database configuration validated"
- [ ] Work order operations work without errors
- [ ] Production environment variables configured (if deploying)

---

## 🆘 Still Having Issues?

### Common Problems

**Problem: "prisma: not found"**
```bash
npm install
```

**Problem: "Database ... does not exist"**
```bash
createdb easypack_dev
# or use your database management tool to create it
```

**Problem: "Connection refused"**
```bash
# Check if PostgreSQL is running
# macOS: brew services list
# Linux: sudo systemctl status postgresql
# Windows: Check Services app
```

**Problem: "Authentication failed"**
- Verify username and password in DATABASE_URL
- Check database user permissions

### Get More Help

1. Check logs: `npm run dev` and look for error messages
2. Test connection: `npx prisma db pull`
3. Review documentation: `docs/DATABASE_CONNECTION_FIX.md`

---

## 📚 Related Documentation

- **Full technical details**: `docs/DATABASE_CONNECTION_FIX.md`
- **Environment variables**: `.env.example`
- **Prisma documentation**: https://www.prisma.io/docs
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres

---

**Last Updated:** 2025-10-31  
**Status:** ⚠️ **ACTION REQUIRED** - Complete Steps 1-4 above
