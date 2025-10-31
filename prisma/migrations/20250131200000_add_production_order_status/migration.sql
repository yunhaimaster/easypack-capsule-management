-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "production_orders" ADD COLUMN "status" "ProductionOrderStatus",
ADD COLUMN "statusUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "production_orders_status_idx" ON "production_orders"("status");
