const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStatuses() {
  try {
    console.log('Checking current status distribution...')
    
    // Get status counts
    const statusCounts = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM "unified_work_orders" 
      GROUP BY status 
      ORDER BY count DESC
    `
    
    console.log('Current status distribution:', statusCounts)
    
    // Get total count
    const totalCount = await prisma.unifiedWorkOrder.count()
    console.log(`Total work orders: ${totalCount}`)
    
  } catch (error) {
    console.error('Error checking statuses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStatuses()
