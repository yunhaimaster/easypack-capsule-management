-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "status" "ProductionOrderStatus";
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "statusUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "production_orders_status_idx" ON "production_orders"("status");

