# Fix Failed Migration P3009

## Problem
Prisma migration `20251026072106_make_person_in_charge_optional` failed on Vercel, and now blocks all future migrations.

## Solution Options

### Option 1: Manual SQL Fix (Recommended)

1. Go to Vercel dashboard → Your project → Storage → Postgres
2. Click "Data" tab → Click "Query"
3. Run this SQL:

```sql
UPDATE "_prisma_migrations" 
SET 
    rolled_back_at = NOW(),
    finished_at = NOW()
WHERE migration_name = '20251026072106_make_person_in_charge_optional' 
AND finished_at IS NULL;
```

4. Verify with:
```sql
SELECT migration_name, started_at, finished_at, rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name LIKE '%person_in_charge%'
ORDER BY started_at DESC;
```

5. Redeploy on Vercel (the next migration will apply the schema change)

### Option 2: Use Vercel CLI (If you have database access)

```bash
# Install Vercel CLI
npm i -g vercel

# Connect to production database
vercel env pull

# Run Prisma migrate resolve
npx prisma migrate resolve --rolled-back 20251026072106_make_person_in_charge_optional

# Push to trigger new deployment
git push origin main
```

### Option 3: Delete and Recreate (Nuclear option)

If the above don't work, you can:
1. Delete the failed migration from `_prisma_migrations` table
2. Let the next migration create a fresh record

## What Happened

1. First migration used wrong table name (`UnifiedWorkOrder` instead of `unified_work_orders`)
2. Migration failed on Vercel
3. Prisma recorded it as "started but not finished"
4. Prisma now blocks all new migrations until resolved

## Files Changed

- Deleted: `prisma/migrations/20251026072106_make_person_in_charge_optional/` (the failed one)
- Kept: `prisma/migrations/20251026072200_resolve_failed_migration/` (the fix)

## After Resolution

Once the failed migration is marked as rolled back, the build will:
1. Skip the failed migration
2. Apply the new `20251026072200_resolve_failed_migration` migration
3. Successfully make `personInChargeId` nullable
4. Allow imports to work with missing person in charge

