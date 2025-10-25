#!/usr/bin/env node

/**
 * Fix Failed Migration Script
 * 
 * This script connects to your production database and marks the failed migration as rolled back.
 * 
 * Usage:
 * 1. Make sure you have your POSTGRES_URL in .env or .env.local
 * 2. Run: node scripts/fix-failed-migration.js
 */

const { PrismaClient } = require('@prisma/client')

async function fixFailedMigration() {
  const prisma = new PrismaClient()

  try {
    console.log('🔧 Connecting to database...')

    // Mark the failed migration as rolled back
    console.log('📝 Marking failed migration as rolled back...')
    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations" 
      SET 
        rolled_back_at = NOW(),
        finished_at = NOW()
      WHERE migration_name = '20251026072106_make_person_in_charge_optional' 
      AND finished_at IS NULL
    `)

    console.log('✅ Failed migration marked as rolled back')

    // Verify the fix
    console.log('\n📊 Verifying...')
    const result = await prisma.$queryRawUnsafe(`
      SELECT 
        migration_name, 
        started_at, 
        finished_at, 
        rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name LIKE '%person_in_charge%'
      ORDER BY started_at DESC
    `)

    console.log('\n✅ Migration status:')
    console.table(result)

    console.log('\n✅ Fix applied successfully!')
    console.log('👉 Now redeploy on Vercel to apply the corrected migration.')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixFailedMigration()

