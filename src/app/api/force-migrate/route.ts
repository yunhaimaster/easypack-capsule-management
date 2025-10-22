import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Emergency endpoint to force run migrations by:
// 1. Clearing failed migration state
// 2. Manually running the auth migration SQL
export async function GET() {
  try {
    console.log('[Force Migrate] Step 1: Clearing failed migration...')
    
    // Step 1: Clear failed migration
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20251020233411_add_ingredient_search_optimization'
      AND finished_at IS NULL;
    `)

    console.log('[Force Migrate] Step 2: Running auth migration...')

    // Step 2: Run the auth migration SQL directly
    await prisma.$executeRawUnsafe(`
      -- CreateEnum
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "AuditAction" AS ENUM ('OTP_SENT', 'OTP_VERIFY_SUCCESS', 'OTP_VERIFY_FAIL', 'LOGIN_SUCCESS', 'LOGOUT', 'SESSION_REFRESH', 'DEVICE_TRUST_CREATED', 'DEVICE_TRUST_REVOKED', 'ROLE_UPDATED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- CreateTable users
      CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL,
          "phoneE164" TEXT NOT NULL,
          "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable sessions
      CREATE TABLE IF NOT EXISTS "sessions" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "revokedAt" TIMESTAMP(3),
          "userAgent" TEXT,
          "ip" TEXT,
          CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable trusted_devices
      CREATE TABLE IF NOT EXISTS "trusted_devices" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "deviceIdHash" TEXT NOT NULL,
          "userAgent" TEXT,
          "ipFirstUsed" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "revokedAt" TIMESTAMP(3),
          CONSTRAINT "trusted_devices_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable audit_logs
      CREATE TABLE IF NOT EXISTS "audit_logs" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "phone" TEXT,
          "action" "AuditAction" NOT NULL,
          "ip" TEXT,
          "userAgent" TEXT,
          "metadata" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
      );

      -- CreateTable otp_attempts
      CREATE TABLE IF NOT EXISTS "otp_attempts" (
          "id" TEXT NOT NULL,
          "phoneE164" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "verifiedAt" TIMESTAMP(3),
          CONSTRAINT "otp_attempts_pkey" PRIMARY KEY ("id")
      );

      -- CreateIndex
      CREATE UNIQUE INDEX IF NOT EXISTS "users_phoneE164_key" ON "users"("phoneE164");
      CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
      CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
      CREATE INDEX IF NOT EXISTS "sessions_expiresAt_idx" ON "sessions"("expiresAt");
      CREATE UNIQUE INDEX IF NOT EXISTS "trusted_devices_userId_deviceIdHash_key" ON "trusted_devices"("userId", "deviceIdHash");
      CREATE INDEX IF NOT EXISTS "trusted_devices_expiresAt_idx" ON "trusted_devices"("expiresAt");
      CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
      CREATE INDEX IF NOT EXISTS "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");
      CREATE INDEX IF NOT EXISTS "otp_attempts_phoneE164_idx" ON "otp_attempts"("phoneE164");
      CREATE INDEX IF NOT EXISTS "otp_attempts_expiresAt_idx" ON "otp_attempts"("expiresAt");

      -- AddForeignKey
      DO $$ BEGIN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    console.log('[Force Migrate] Step 3: Recording migration...')

    // Step 3: Record the migration as applied
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid()::text,
        'force_applied',
        NOW(),
        '20251022000000_add_otp_auth_system',
        'Manually applied via /api/force-migrate',
        NULL,
        NOW(),
        1
      )
      ON CONFLICT DO NOTHING;
    `)

    return NextResponse.json({
      success: true,
      message: 'Auth migration forcefully applied!',
      nextSteps: [
        '1. Auth tables created successfully',
        '2. Failed migration state cleared',
        '3. Migration recorded in database',
        '4. You can now use the login page!'
      ]
    })
  } catch (error) {
    console.error('[Force Migrate] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}

