-- Raw SQL to update all PENDING statuses to NULL
UPDATE "UnifiedWorkOrder" 
SET status = NULL 
WHERE status = 'PENDING';

-- Verify the changes
SELECT status, COUNT(*) as count 
FROM "UnifiedWorkOrder" 
GROUP BY status 
ORDER BY count DESC;
