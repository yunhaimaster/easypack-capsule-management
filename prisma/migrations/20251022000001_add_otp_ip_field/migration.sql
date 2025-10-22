-- AlterTable
ALTER TABLE "otp_attempts" ADD COLUMN "ip" TEXT;

-- CreateIndex
CREATE INDEX "otp_attempts_ip_createdAt_idx" ON "otp_attempts"("ip", "createdAt");

