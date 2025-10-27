-- Raw SQL migration to update existing work order statuses
-- This will update the data before changing the enum

-- Update existing statuses to new system
UPDATE "UnifiedWorkOrder" 
SET status = NULL 
WHERE status IN ('PENDING', 'NOTIFIED', 'SHIPPED', 'ON_HOLD', 'DRAFT');

-- Verify the changes
SELECT status, COUNT(*) as count 
FROM "UnifiedWorkOrder" 
GROUP BY status 
ORDER BY count DESC;
