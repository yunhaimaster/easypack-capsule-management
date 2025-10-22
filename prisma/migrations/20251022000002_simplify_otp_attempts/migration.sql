-- AlterTable - Drop unused columns from otp_attempts
-- We only use this table for rate limiting, not storing actual OTP codes
ALTER TABLE "otp_attempts" DROP COLUMN IF EXISTS "expiresAt";
ALTER TABLE "otp_attempts" DROP COLUMN IF EXISTS "verifiedAt";

