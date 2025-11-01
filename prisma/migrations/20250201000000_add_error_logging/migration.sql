-- CreateEnum
CREATE TYPE "ErrorSeverity" AS ENUM ('WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "severity" "ErrorSeverity" NOT NULL DEFAULT 'ERROR',
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "pageUrl" VARCHAR(500),
    "apiRoute" VARCHAR(200),
    "httpStatus" INTEGER,
    "userAgent" TEXT,
    "ip" VARCHAR(45),
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");

-- CreateIndex
CREATE INDEX "error_logs_severity_createdAt_idx" ON "error_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_userId_createdAt_idx" ON "error_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_resolved_createdAt_idx" ON "error_logs"("resolved", "createdAt");

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
