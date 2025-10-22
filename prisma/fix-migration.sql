-- Fix failed migration state
-- This marks the failed migration as rolled back so new migrations can proceed

-- Delete the failed migration record
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20251020233411_add_ingredient_search_optimization' 
AND finished_at IS NULL;

-- If the migration partially applied, you may need to manually clean up
-- Check what tables/columns were created and drop them if needed

