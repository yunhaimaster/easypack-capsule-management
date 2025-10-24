-- AlterTable
ALTER TABLE "unified_work_orders" 
  -- 改為可選
  ALTER COLUMN "jobNumber" DROP NOT NULL,
  
  -- 記號日期改為必填且有預設值
  ALTER COLUMN "markedDate" SET NOT NULL,
  ALTER COLUMN "markedDate" SET DEFAULT CURRENT_TIMESTAMP,
  
  -- 新增VIP標記欄位
  ADD COLUMN IF NOT EXISTS "isCustomerServiceVip" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isBossVip" BOOLEAN NOT NULL DEFAULT false,
  
  -- 新增物料到齊狀態欄位
  ADD COLUMN IF NOT EXISTS "expectedProductionMaterialsDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "expectedPackagingMaterialsDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "productionMaterialsReady" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "packagingMaterialsReady" BOOLEAN NOT NULL DEFAULT false,
  
  -- 新增交貨期欄位
  ADD COLUMN IF NOT EXISTS "requestedDeliveryDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "internalExpectedDate" TIMESTAMP(3),
  
  -- 新增狀態標記欄位
  ADD COLUMN IF NOT EXISTS "isUrgent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "productionStarted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS "unified_work_orders_markedDate_idx" ON "unified_work_orders"("markedDate");

