import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * One-time fix for schema drift issue
 * Manually applies the nickname column and LOGIN_FAILED enum value
 * 
 * DELETE THIS FILE after running successfully!
 */

export const dynamic = 'force-dynamic'

async function runFix() {
  try {
    console.log('[Schema Drift Fix] Starting manual schema fix...')

    // Execute the migration SQL directly
    await prisma.$executeRawUnsafe(`
      -- Add LOGIN_FAILED to AuditAction enum if not exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'LOGIN_FAILED' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')
        ) THEN
          ALTER TYPE "AuditAction" ADD VALUE 'LOGIN_FAILED';
        END IF;
      END
      $$;
    `)

    console.log('[Schema Drift Fix] ✅ LOGIN_FAILED enum value added (if not existed)')

    // Add nickname column if not exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nickname" VARCHAR(50);
    `)

    console.log('[Schema Drift Fix] ✅ nickname column added (if not existed)')

    // Verify the fix
    const testQuery = await prisma.$queryRaw`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'nickname';
    `

    console.log('[Schema Drift Fix] ✅ Verification result:', testQuery)

    return NextResponse.json({
      success: true,
      message: 'Schema drift fixed successfully! DELETE this API route now.',
      verification: testQuery
    })

  } catch (error) {
    console.error('[Schema Drift Fix] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}

// Support both GET and POST for easy browser access
export async function GET(request: NextRequest) {
  return runFix()
}

export async function POST(request: NextRequest) {
  return runFix()
}

