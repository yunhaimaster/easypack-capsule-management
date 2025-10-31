-- Add columns only (enum already exists)
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "status" "ProductionOrderStatus";
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "statusUpdatedAt" TIMESTAMP(3);

-- CreateIndex (if it doesn't exist)
CREATE INDEX IF NOT EXISTS "production_orders_status_idx" ON "production_orders"("status");

