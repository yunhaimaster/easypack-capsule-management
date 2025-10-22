import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Emergency endpoint to fix failed migration state
// Call this ONCE after deployment to clear the failed migration
export async function POST() {
  try {
    // Delete the failed migration record from _prisma_migrations table
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20251020233411_add_ingredient_search_optimization'
      AND finished_at IS NULL;
    `)

    return NextResponse.json({
      success: true,
      message: 'Failed migration cleared. Redeploy to run new migrations.'
    })
  } catch (error) {
    console.error('[Fix Migration] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

