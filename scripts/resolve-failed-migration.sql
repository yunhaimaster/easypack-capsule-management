-- MANUAL FIX: Run this SQL directly on production database to resolve failed migration
-- This should be run ONCE via Vercel Postgres dashboard or psql

-- Step 1: Mark the failed migration as rolled back
UPDATE "_prisma_migrations" 
SET 
    rolled_back_at = NOW(),
    finished_at = NOW()
WHERE migration_name = '20251026072106_make_person_in_charge_optional' 
AND finished_at IS NULL;

-- Step 2: Verify the fix
SELECT 
    migration_name, 
    started_at, 
    finished_at, 
    rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name LIKE '%person_in_charge%'
ORDER BY started_at DESC;

-- Expected result: The failed migration should now have both finished_at and rolled_back_at timestamps

