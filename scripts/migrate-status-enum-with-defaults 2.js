const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateStatusEnumWithDefaults() {
  try {
    console.log('Starting custom status enum migration with default handling...')
    
    // Step 1: Check current column definition
    console.log('Step 1: Checking current column definition...')
    const columnInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'unified_work_orders' AND column_name = 'status'
    `
    console.log('Current status column info:', columnInfo)
    
    // Step 2: Drop the default first
    console.log('Step 2: Dropping default value...')
    await prisma.$executeRaw`
      ALTER TABLE "unified_work_orders" 
      ALTER COLUMN status DROP DEFAULT
    `
    
    // Step 3: Create new enum with only CANCELLED and COMPLETED
    console.log('Step 3: Creating new WorkOrderStatus enum...')
    await prisma.$executeRaw`
      CREATE TYPE "WorkOrderStatus_new" AS ENUM ('CANCELLED', 'COMPLETED')
    `
    
    // Step 4: Update the column to use the new enum and make it nullable
    console.log('Step 4: Updating status column to be nullable...')
    await prisma.$executeRaw`
      ALTER TABLE "unified_work_orders" 
      ALTER COLUMN status TYPE "WorkOrderStatus_new" USING NULL
    `
    
    // Step 5: Drop the old enum
    console.log('Step 5: Dropping old enum...')
    await prisma.$executeRaw`
      DROP TYPE "WorkOrderStatus"
    `
    
    // Step 6: Rename the new enum
    console.log('Step 6: Renaming new enum...')
    await prisma.$executeRaw`
      ALTER TYPE "WorkOrderStatus_new" RENAME TO "WorkOrderStatus"
    `
    
    // Step 7: Verify the changes
    console.log('Step 7: Verifying changes...')
    const statusCounts = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM "unified_work_orders" 
      GROUP BY status 
      ORDER BY count DESC
    `
    
    console.log('Final status distribution:', statusCounts)
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    
    // Cleanup on error
    try {
      console.log('Cleaning up on error...')
      await prisma.$executeRaw`DROP TYPE IF EXISTS "WorkOrderStatus_new"`
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError)
    }
  } finally {
    await prisma.$disconnect()
  }
}

migrateStatusEnumWithDefaults()
