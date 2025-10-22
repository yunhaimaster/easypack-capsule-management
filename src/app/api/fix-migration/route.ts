import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Emergency endpoint to fix failed migration state
// Visit this page ONCE after deployment to clear the failed migration
async function fixMigration() {
  try {
    // Delete the failed migration record from _prisma_migrations table
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20251020233411_add_ingredient_search_optimization'
      AND finished_at IS NULL;
    `)

    return NextResponse.json({
      success: true,
      message: 'Failed migration cleared. Redeploy to run new migrations.',
      nextSteps: [
        '1. This endpoint has cleared the failed migration state',
        '2. Go to Vercel dashboard and click "Redeploy"',
        '3. New auth migrations will run successfully'
      ]
    })
  } catch (error) {
    console.error('[Fix Migration] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return fixMigration()
}

export async function POST() {
  return fixMigration()
}

