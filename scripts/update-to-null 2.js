// Raw SQL migration script
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateToNull() {
  try {
    console.log('Updating PENDING statuses to NULL...')
    
    // Use raw SQL to update status to NULL
    const result = await prisma.$executeRaw`
      UPDATE "unified_work_orders" 
      SET status = NULL 
      WHERE status = 'PENDING'
    `
    
    console.log(`Updated ${result} work orders to NULL status`)
    
    // Verify the changes
    const statusCounts = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM "unified_work_orders" 
      GROUP BY status 
      ORDER BY count DESC
    `
    
    console.log('After update:', statusCounts)
    console.log('Update completed successfully!')
    
  } catch (error) {
    console.error('Update failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateToNull()
