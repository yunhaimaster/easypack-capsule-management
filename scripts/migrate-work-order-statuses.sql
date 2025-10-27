-- Migration script to update existing work order statuses to new simplified system
-- Run this BEFORE applying the schema changes

-- Update existing statuses to new system:
-- PENDING, NOTIFIED, SHIPPED, ON_HOLD, DRAFT -> NULL (ongoing work)
-- COMPLETED -> COMPLETED (keep as is)
-- CANCELLED -> CANCELLED (keep as is)

UPDATE "UnifiedWorkOrder" 
SET status = NULL 
WHERE status IN ('PENDING', 'NOTIFIED', 'SHIPPED', 'ON_HOLD', 'DRAFT');

-- Verify the changes
SELECT status, COUNT(*) as count 
FROM "UnifiedWorkOrder" 
GROUP BY status 
ORDER BY count DESC;
