-- Apply schema change to make personInChargeId nullable
-- This replaces the failed 20251026072106 migration

-- Make personInChargeId nullable (idempotent)
DO $$
BEGIN
    -- Check if personInChargeId exists and is NOT NULL
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
