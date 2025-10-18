-- 添加 isCustomerProvided 字段到 ingredients 表
ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "isCustomerProvided" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "isCustomerSupplied" BOOLEAN NOT NULL DEFAULT true;

-- 添加缺失的字段到 production_orders 表
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "productName" TEXT NOT NULL DEFAULT '未命名產品';
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "capsuleColor" TEXT;
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "capsuleSize" TEXT;
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "capsuleType" TEXT;
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "customerService" TEXT;
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "actualProductionQuantity" INTEGER;
ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "materialYieldQuantity" INTEGER;

-- 工時表
CREATE TABLE IF NOT EXISTS "order_worklogs" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "headcount" INTEGER NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "notes" TEXT,
    "effectiveMinutes" INTEGER NOT NULL,
    "calculatedWorkUnits" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "order_worklogs_orderId_workDate_idx" ON "order_worklogs" ("orderId", "workDate");

ALTER TABLE "order_worklogs" ADD CONSTRAINT IF NOT EXISTS "order_worklogs_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 移除舊的 productCode 字段（如果存在）
ALTER TABLE "production_orders" DROP COLUMN IF EXISTS "productCode";
