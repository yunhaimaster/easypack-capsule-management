import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API endpoint to resolve failed migration
 * This marks the failed migration as rolled back so new deployments can proceed
 * 
 * USAGE: 
 * 1. Deploy this fix to Vercel
 * 2. Visit: https://your-app.vercel.app/api/resolve-migration
 * 3. DELETE this file after successful execution
 * 
 * Security: This endpoint should be protected or deleted after use
 */

export async function GET() {
  try {
    // Check if the migration exists and is in failed state
    const failedMigration = await prisma.$queryRaw<Array<any>>`
      SELECT migration_name, started_at, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20251020233411_add_ingredient_search_optimization'
      LIMIT 1
    `
    
    if (failedMigration.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Migration record not found. It may have been already resolved or never existed.',
        action: 'none'
      })
    }
    
    const migration = failedMigration[0]
    
    // If already rolled back
    if (migration.rolled_back_at) {
      return NextResponse.json({
        success: true,
        message: 'Migration already marked as rolled back.',
        migration: {
          name: migration.migration_name,
          started_at: migration.started_at,
          rolled_back_at: migration.rolled_back_at
        },
        action: 'none'
      })
    }
    
    // Mark as rolled back
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations"
      SET finished_at = NOW(),
          rolled_back_at = NOW()
      WHERE migration_name = '20251020233411_add_ingredient_search_optimization'
    `
    
    return NextResponse.json({
      success: true,
      message: 'Failed migration has been successfully marked as rolled back. Future deployments should now succeed.',
      migration: {
        name: migration.migration_name,
        started_at: migration.started_at,
        rolled_back_at: new Date().toISOString()
      },
      action: 'resolved',
      nextSteps: [
        '1. Redeploy the application (git push)',
        '2. Verify deployment succeeds',
        '3. DELETE src/app/api/resolve-migration/route.ts for security'
      ]
    })
  } catch (error) {
    console.error('Resolve migration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve migration',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

