-- Backfill status for existing orders
UPDATE "production_orders" po
SET 
  "status" = CASE
    WHEN po."completionDate" IS NOT NULL THEN 'COMPLETED'
    WHEN EXISTS (SELECT 1 FROM "order_worklogs" ow WHERE ow."orderId" = po."id") THEN 'IN_PROGRESS'
    ELSE 'NOT_STARTED'
  END,
  "statusUpdatedAt" = NOW()
WHERE "status" IS NULL;

