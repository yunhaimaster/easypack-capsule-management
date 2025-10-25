/**
 * TEMPORARY: Fix failed migration P3009
 * 
 * Visit this endpoint ONCE to mark the failed migration as rolled back:
 * https://your-domain.vercel.app/api/admin/fix-migration
 * 
 * DELETE THIS FILE after the migration is resolved.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Mark the failed migration as rolled back
    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations" 
      SET 
        rolled_back_at = NOW(),
        finished_at = NOW()
      WHERE migration_name = '20251026072106_make_person_in_charge_optional' 
      AND finished_at IS NULL
    `)

    // Verify the fix
    const result = await prisma.$queryRawUnsafe<Array<{
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
      WHERE migration_name LIKE '%person_in_charge%'
      ORDER BY started_at DESC
    `)

    return NextResponse.json({
      success: true,
      message: 'Failed migration marked as rolled back',
      migrations: result
    })

  } catch (error) {
    console.error('[Fix Migration] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fix migration'
      },
      { status: 500 }
    )
  }
}

