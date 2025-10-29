-- AlterTable
ALTER TABLE "production_orders" ADD COLUMN "workOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_workOrderId_key" ON "production_orders"("workOrderId");

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "unified_work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

