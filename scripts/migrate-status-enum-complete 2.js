const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateStatusEnumComplete() {
  try {
    console.log('Starting complete status enum migration...')
    
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
    
    // Step 3: Make the column nullable first
    console.log('Step 3: Making column nullable...')
    await prisma.$executeRaw`
      ALTER TABLE "unified_work_orders" 
      ALTER COLUMN status DROP NOT NULL
    `
    
    // Step 4: Update all PENDING values to NULL
    console.log('Step 4: Updating PENDING values to NULL...')
    await prisma.$executeRaw`
      UPDATE "unified_work_orders" 
      SET status = NULL 
      WHERE status = 'PENDING'
    `
    
    // Step 5: Create new enum with only CANCELLED and COMPLETED
    console.log('Step 5: Creating new WorkOrderStatus enum...')
    await prisma.$executeRaw`
      CREATE TYPE "WorkOrderStatus_new" AS ENUM ('CANCELLED', 'COMPLETED')
    `
    
    // Step 6: Update the column to use the new enum
    console.log('Step 6: Updating status column to use new enum...')
    await prisma.$executeRaw`
      ALTER TABLE "unified_work_orders" 
      ALTER COLUMN status TYPE "WorkOrderStatus_new" USING status::text::"WorkOrderStatus_new"
    `
    
    // Step 7: Drop the old enum
    console.log('Step 7: Dropping old enum...')
    await prisma.$executeRaw`
      DROP TYPE "WorkOrderStatus"
    `
    
    // Step 8: Rename the new enum
    console.log('Step 8: Renaming new enum...')
    await prisma.$executeRaw`
      ALTER TYPE "WorkOrderStatus_new" RENAME TO "WorkOrderStatus"
    `
    
    // Step 9: Verify the changes
    console.log('Step 9: Verifying changes...')
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

migrateStatusEnumComplete()
