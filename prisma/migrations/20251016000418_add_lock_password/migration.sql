-- Add lockPassword column to production_orders table
ALTER TABLE "production_orders" ADD COLUMN "lockPassword" TEXT;
