# Local Development Setup Guide

## Problem
Running `npm run build` locally fails with database connection errors because the standard build script tries to run database migrations, which require PostgreSQL.

## Solution
Use the **`build:local`** script which skips database migrations. This allows you to test builds locally without installing PostgreSQL.

---

## Quick Setup (2 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Navigate to project directory
cd /Users/yunhaimaster/Library/Mobile\ Documents/com~apple~CloudDocs/Downloads/capsuleDB

# Run setup script (creates .env.local and generates Prisma client)
./scripts/setup-local-db.sh
```

### Option 2: Manual Setup

```bash
# 1. Create .env.local file (if not exists)
cat > .env.local << 'EOF'
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SESSION_SECRET="local-dev-secret-change-in-production"
ADMIN_BOOTSTRAP_PHONE="+85200000000"
ADMIN_BOOTSTRAP_CODE="0000"
OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EOF

# 2. Generate Prisma Client
npx prisma generate
```

### 3. Test Build

```bash
# Use build:local (skips database migrations)
npm run build:local
```

Should now complete successfully! ✅

---

## Build Scripts Explained

| Command | When to Use | Database Required? |
|---------|-------------|-------------------|
| **`npm run build:local`** | Local testing | ❌ No |
| **`npm run build`** | Production (Vercel) | ✅ Yes (PostgreSQL) |

### Why Two Build Scripts?

- **`build`** (production): Runs migrations + generate + build
  - Used by Vercel deployment
  - Requires PostgreSQL connection
  
- **`build:local`** (development): Only generate + build
  - Skips migrations (no database needed)
  - Perfect for local build testing
  - Uses mock DATABASE_URL for Prisma schema validation

---

## What Files Are Created?

```
project-root/
├── .env.local           # Local environment variables (gitignored)
└── node_modules/
    └── @prisma/client   # Generated Prisma client
```

The `.env.local` file is **automatically gitignored** and won't affect your production deployment.

---

## Environment Files Explained

| File | Purpose | Committed? | Used By |
|------|---------|------------|---------|
| `.env.local` | Local development | ❌ No | Your machine only |
| `.env.production` | Production (Vercel) | ❌ No | Vercel dashboard |

---

## Database Providers by Environment

| Environment | Provider | Build Command |
|-------------|----------|---------------|
| **Local Development** | None (mock URL) | `npm run build:local` |
| **Production (Vercel)** | PostgreSQL | `npm run build` |

---

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Problem**: `.env.local` doesn't exist.

**Solution**:
```bash
./scripts/setup-local-db.sh
```

### Error: "Prisma schema loaded but client not found"

**Problem**: Prisma client not generated.

**Solution**:
```bash
npx prisma generate
```

### Build Fails with "prisma migrate deploy failed"

**Problem**: You're using `npm run build` instead of `npm run build:local`.

**Solution**:
```bash
# For local testing, use:
npm run build:local

# NOT:
npm run build  # ← This requires PostgreSQL
```

### Build Still Fails

**Problem**: Cached files might be outdated.

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
rm -rf node_modules/.prisma

# Regenerate and build
npx prisma generate
npm run build:local
```

---

## Development Workflow

### Daily Development

```bash
# Start development server (no database needed for UI work)
npm run dev

# When making changes, test build
npm run build:local
```

### Before Pushing to GitHub

```bash
# Test build locally (REQUIRED by project rules)
npm run build:local

# If successful, commit and push
git add -A
git commit -m "✨ feat: your changes"
git push
```

### Vercel Deployment

- Vercel automatically runs `npm run build` (with migrations)
- Uses PostgreSQL from Vercel Postgres
- No action needed from you

---

## Testing With Real Database (Optional)

If you need to test with actual data locally, you have two options:

### Option A: Use Vercel Postgres (Recommended)

```bash
# 1. Get your production DATABASE_URL from Vercel
# 2. Add to .env.local:
DATABASE_URL="postgresql://user:pass@host:5432/db"

# 3. Now you can use full build
npm run build
```

⚠️ **Warning**: This connects to your production database!

### Option B: Install PostgreSQL Locally

```bash
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb capsuledb

# Update .env.local
DATABASE_URL="postgresql://localhost:5432/capsuledb"

# Run migrations
npx prisma migrate deploy

# Now you can use full build
npm run build
```

---

## Quick Reference

```bash
# Common commands for local development

# Setup (run once)
./scripts/setup-local-db.sh

# Development server
npm run dev

# Build project (NO database needed)
npm run build:local

# Generate Prisma client
npx prisma generate

# Type check only
npx tsc --noEmit
```

---

## Security Note

The `.env.local` file contains **mock credentials** that don't work:
- DATABASE_URL points to dummy PostgreSQL (never used during build:local)
- Twilio credentials are fake (won't send SMS)
- Admin bootstrap code is fake (won't allow login)

**For actual local testing with features**, you need to:
1. Get real credentials from respective services
2. Add them to `.env.local`
3. Optionally set up PostgreSQL for database features

**For just building**, the mock credentials are sufficient.

---

## CI/CD Note

Your Vercel production environment:
- Uses `npm run build` (with migrations)
- Connects to Vercel PostgreSQL
- Is **not affected** by this local setup

The `.env.local` file is only used on your machine.

---

## Next Steps

✅ You can now:
- Run `npm run build:local` without errors
- Develop and test locally without PostgreSQL
- Follow the project rule: "Always test build before committing"
- Deploy to Vercel (uses PostgreSQL automatically)

🎉 Happy coding!

---

## Summary

**Problem**: `npm run build` requires PostgreSQL  
**Solution**: Use `npm run build:local` instead  
**Setup**: Run `./scripts/setup-local-db.sh` once  
**Test Build**: `npm run build:local` ✅  
**Deploy**: Vercel handles everything automatically  


