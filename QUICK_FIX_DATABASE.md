# 🚨 QUICK FIX: Database Connection Error

**Error**: `Can't reach database server at db.prisma.io:5432`

---

## ⚡ 3-Minute Fix

### 1. Configure Database (Choose ONE)

**A) Local PostgreSQL:**
```bash
# .env.local
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/easypack_dev"
```

**B) Vercel Postgres:**
```bash
# .env.local
POSTGRES_PRISMA_URL="postgres://default:xxxxx@xxxxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
```

### 2. Set Session Secret
```bash
# Generate
openssl rand -hex 32

# Add to .env.local
SESSION_SECRET="paste-generated-key-here"
```

### 3. Run Migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Start Server
```bash
npm run dev
```

**Expected**: `✅ Database configuration validated`

---

## 🎯 What Was Fixed

### Problem
- ❌ No `DATABASE_URL` configured
- ❌ Multiple Prisma instances
- ❌ Connection pool exhaustion
- ❌ Placeholder URL: `db.prisma.io:5432`

### Solution
- ✅ Created `.env.local` template
- ✅ Fixed singleton pattern in 3 migration routes
- ✅ Added database validation
- ✅ Clear error messages

---

## 📋 Checklist

- [ ] `.env.local` exists with valid `DATABASE_URL`
- [ ] `SESSION_SECRET` configured (32+ chars)
- [ ] `npm run dev` shows "✅ Database configuration validated"
- [ ] Work orders load without errors
- [ ] Link operations work

---

## 🆘 Still Stuck?

**See Full Guide**: `SETUP_DATABASE.md`  
**Technical Details**: `docs/DATABASE_CONNECTION_FIX.md`

---

**Common Issues:**

❌ **"prisma: not found"** → `npm install`  
❌ **"Database does not exist"** → `createdb easypack_dev`  
❌ **"Connection refused"** → Start PostgreSQL service  
❌ **"Authentication failed"** → Check username/password  

---

✅ **Fixed**: 2025-10-31  
⚠️ **Action**: Configure `.env.local`
