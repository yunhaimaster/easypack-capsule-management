-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_FAILED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nickname" VARCHAR(50);

