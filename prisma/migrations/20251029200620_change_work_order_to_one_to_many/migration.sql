-- Remove unique constraint from workOrderId to allow 1:many relationship
DROP INDEX IF EXISTS "production_orders_workOrderId_key";

-- Create regular index for query performance (non-unique)
CREATE INDEX IF NOT EXISTS "production_orders_workOrderId_idx" ON "production_orders"("workOrderId");

