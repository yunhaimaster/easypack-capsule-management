const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateStatusesToNull() {
  try {
    console.log('Updating all PENDING statuses to NULL...')
    
    // First, let's update all PENDING statuses to NULL using raw SQL
    // We need to handle this carefully since the field might have constraints
    
    // Try to update using Prisma first
    try {
      const result = await prisma.unifiedWorkOrder.updateMany({
        where: {
          status: 'PENDING'
        },
        data: {
          status: null
        }
      })
      console.log(`Updated ${result.count} work orders to NULL status using Prisma`)
    } catch (prismaError) {
      console.log('Prisma update failed, trying raw SQL...')
      console.log('Prisma error:', prismaError.message)
      
      // If Prisma fails, try raw SQL
      const result = await prisma.$executeRaw`
        UPDATE "unified_work_orders" 
        SET status = NULL 
        WHERE status = 'PENDING'
      `
      console.log(`Updated ${result} work orders to NULL status using raw SQL`)
    }
    
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

updateStatusesToNull()
