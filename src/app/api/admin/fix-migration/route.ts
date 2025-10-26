/**
 * TEMPORARY: Fix failed migration P3009
 * 
 * Visit this endpoint ONCE to delete the failed migration:
 * https://your-domain.vercel.app/api/admin/fix-migration
 * 
 * DELETE THIS FILE after the migration is resolved.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function fixFailedMigration() {
  try {
    // First, check what failed migrations exist
    const failedMigrations = await prisma.$queryRawUnsafe<Array<{
      migration_name: string
      started_at: Date
      finished_at: Date | null
      rolled_back_at: Date | null
    }>>(`
      SELECT 
        migration_name, 
        started_at, 
        finished_at, 
        rolled_back_at
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL
      ORDER BY started_at DESC
    `)

    if (failedMigrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No failed migrations found. All migrations are clean!',
        migrations: []
      })
    }

    // Delete the failed migration record(s)
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20251026072106_make_person_in_charge_optional'
      AND finished_at IS NULL
    `)

    return NextResponse.json({
      success: true,
      message: 'Failed migration deleted successfully! Ready to redeploy.',
      deletedMigrations: failedMigrations,
      nextSteps: [
        '✅ Failed migration has been deleted from the database',
        '🔄 Go to Vercel Dashboard and click "Redeploy"',
        '🚀 The migration will run cleanly on next deployment'
      ]
    })

  } catch (error) {
    console.error('[Fix Migration] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fix migration',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return fixFailedMigration()
}

export async function POST(request: NextRequest) {
  return fixFailedMigration()
}

