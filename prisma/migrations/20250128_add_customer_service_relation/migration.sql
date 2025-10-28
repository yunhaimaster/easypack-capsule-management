-- Add customerServiceId column to production_orders
ALTER TABLE "production_orders" ADD COLUMN "customerServiceId" TEXT;

-- Copy existing customerService text to a temporary column for reference (optional manual migration)
-- NOTE: This migration does NOT automatically migrate old text values to user IDs
-- You may need to manually map old customerService names to user IDs after deployment

-- Drop the old customerService column
ALTER TABLE "production_orders" DROP COLUMN IF EXISTS "customerService";

-- Add foreign key constraint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_customerServiceId_fkey" 
  FOREIGN KEY ("customerServiceId") REFERENCES "users"("id") ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX "production_orders_customerServiceId_idx" ON "production_orders"("customerServiceId");

