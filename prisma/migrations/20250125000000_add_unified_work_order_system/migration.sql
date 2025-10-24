-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'DATA_COMPLETE', 'NOTIFIED', 'PAID', 'SHIPPED', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('PACKAGING', 'PRODUCTION', 'PRODUCTION_PACKAGING', 'WAREHOUSING');

-- AlterEnum
-- Add new audit actions for work order system
ALTER TYPE "AuditAction" ADD VALUE 'WORK_ORDER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'WORK_ORDER_VIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'WORK_ORDER_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'WORK_ORDER_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'WORK_ORDER_EXPORTED';
ALTER TYPE "AuditAction" ADD VALUE 'WORK_ORDER_BULK_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'WORK_ORDER_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'CAPSULATION_ORDER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CAPSULATION_ORDER_VIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'CAPSULATION_ORDER_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CAPSULATION_ORDER_DELETED';

-- Rename existing work_orders table to legacy_work_orders
ALTER TABLE "work_orders" RENAME TO "legacy_work_orders";

-- Update QCFile foreign key reference
ALTER TABLE "qc_files" RENAME COLUMN "workOrderId" TO "legacyWorkOrderId";

-- CreateTable: UnifiedWorkOrder
CREATE TABLE "unified_work_orders" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PENDING',
    "statusUpdatedAt" TIMESTAMP(3),
    "statusUpdatedBy" TEXT,
    "markedDate" TIMESTAMP(3),
    "customerName" VARCHAR(200) NOT NULL,
    "personInChargeId" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "isNewProductVip" BOOLEAN NOT NULL DEFAULT false,
    "isComplexityVip" BOOLEAN NOT NULL DEFAULT false,
    "yearCategory" VARCHAR(50),
    "expectedCompletionDate" TIMESTAMP(3),
    "dataCompleteDate" TIMESTAMP(3),
    "notifiedDate" TIMESTAMP(3),
    "paymentReceivedDate" TIMESTAMP(3),
    "shippedDate" TIMESTAMP(3),
    "productionQuantityStat" TEXT,
    "packagingQuantityStat" TEXT,
    "productionQuantity" INTEGER,
    "packagingQuantity" INTEGER,
    "internalDeliveryTime" VARCHAR(100),
    "customerRequestedTime" VARCHAR(100),
    "tokyoData" TEXT,
    "workDescription" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "unified_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CapsulationOrder
CREATE TABLE "capsulation_orders" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "productName" TEXT NOT NULL DEFAULT '未命名產品',
    "productionQuantity" INTEGER NOT NULL,
    "unitWeightMg" DOUBLE PRECISION NOT NULL,
    "batchTotalWeightMg" DOUBLE PRECISION NOT NULL,
    "completionDate" TIMESTAMP(3),
    "customerServiceId" TEXT,
    "capsuleColor" TEXT,
    "capsuleSize" TEXT,
    "capsuleType" TEXT,
    "processIssues" TEXT,
    "qualityNotes" TEXT,
    "actualProductionQuantity" INTEGER,
    "materialYieldQuantity" INTEGER,
    "lockPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capsulation_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CapsulationIngredient
CREATE TABLE "capsulation_ingredients" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "unitContentMg" DOUBLE PRECISION NOT NULL,
    "isCustomerProvided" BOOLEAN NOT NULL DEFAULT true,
    "isCustomerSupplied" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "capsulation_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CapsulationWorklog
CREATE TABLE "capsulation_worklogs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "headcount" INTEGER NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "notes" TEXT,
    "effectiveMinutes" INTEGER NOT NULL,
    "calculatedWorkUnits" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capsulation_worklogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unified_work_orders_jobNumber_key" ON "unified_work_orders"("jobNumber");

-- CreateIndex
CREATE INDEX "unified_work_orders_jobNumber_idx" ON "unified_work_orders"("jobNumber");

-- CreateIndex
CREATE INDEX "unified_work_orders_customerName_idx" ON "unified_work_orders"("customerName");

-- CreateIndex
CREATE INDEX "unified_work_orders_personInChargeId_idx" ON "unified_work_orders"("personInChargeId");

-- CreateIndex
CREATE INDEX "unified_work_orders_workType_idx" ON "unified_work_orders"("workType");

-- CreateIndex
CREATE INDEX "unified_work_orders_status_idx" ON "unified_work_orders"("status");

-- CreateIndex
CREATE INDEX "unified_work_orders_expectedCompletionDate_idx" ON "unified_work_orders"("expectedCompletionDate");

-- CreateIndex
CREATE INDEX "unified_work_orders_createdAt_idx" ON "unified_work_orders"("createdAt" DESC);

-- CreateIndex (Composite for common queries)
CREATE INDEX "unified_work_orders_customerName_workType_idx" ON "unified_work_orders"("customerName", "workType");

-- CreateIndex (Composite for dashboard)
CREATE INDEX "unified_work_orders_status_expectedCompletionDate_idx" ON "unified_work_orders"("status", "expectedCompletionDate");

-- CreateIndex
CREATE UNIQUE INDEX "capsulation_orders_workOrderId_key" ON "capsulation_orders"("workOrderId");

-- CreateIndex
CREATE INDEX "capsulation_orders_workOrderId_idx" ON "capsulation_orders"("workOrderId");

-- CreateIndex
CREATE INDEX "capsulation_orders_customerServiceId_idx" ON "capsulation_orders"("customerServiceId");

-- CreateIndex
CREATE INDEX "capsulation_ingredients_orderId_idx" ON "capsulation_ingredients"("orderId");

-- CreateIndex
CREATE INDEX "capsulation_ingredients_materialName_idx" ON "capsulation_ingredients"("materialName");

-- CreateIndex
CREATE INDEX "capsulation_worklogs_orderId_workDate_idx" ON "capsulation_worklogs"("orderId", "workDate");

-- CreateIndex
CREATE INDEX "capsulation_worklogs_workDate_createdAt_idx" ON "capsulation_worklogs"("workDate", "createdAt");

-- AddForeignKey
ALTER TABLE "unified_work_orders" ADD CONSTRAINT "unified_work_orders_personInChargeId_fkey" FOREIGN KEY ("personInChargeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capsulation_orders" ADD CONSTRAINT "capsulation_orders_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "unified_work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capsulation_orders" ADD CONSTRAINT "capsulation_orders_customerServiceId_fkey" FOREIGN KEY ("customerServiceId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capsulation_ingredients" ADD CONSTRAINT "capsulation_ingredients_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "capsulation_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capsulation_worklogs" ADD CONSTRAINT "capsulation_worklogs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "capsulation_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

