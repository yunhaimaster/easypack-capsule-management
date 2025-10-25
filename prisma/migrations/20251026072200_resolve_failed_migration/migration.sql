-- Resolve failed migration and apply correct schema change
-- The previous migration (20251026072106) failed due to incorrect table name

-- Step 1: Mark the failed migration as rolled back
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20251026072106_make_person_in_charge_optional' 
AND finished_at IS NULL;

-- Step 2: Apply the actual schema change (if not already applied)
-- Use DO block to check if column is already nullable
DO $$
BEGIN
    -- Check if personInChargeId is NOT NULL
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'unified_work_orders' 
        AND column_name = 'personInChargeId' 
        AND is_nullable = 'NO'
    ) THEN
        -- Make it nullable
        ALTER TABLE "unified_work_orders" ALTER COLUMN "personInChargeId" DROP NOT NULL;
    END IF;
END $$;
