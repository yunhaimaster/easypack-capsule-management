// Manual migration script to update existing work order statuses
// Run this with: node scripts/migrate-statuses.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateStatuses() {
  try {
    console.log('Starting status migration...')
    
    // Get current status counts
    const statusCounts = await prisma.unifiedWorkOrder.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log('Before migration:', statusCounts)
    
    // Update existing statuses to new system
    const updateResult = await prisma.unifiedWorkOrder.updateMany({
      where: {
        status: {
          in: ['PENDING', 'NOTIFIED', 'SHIPPED', 'ON_HOLD', 'DRAFT']
        }
      },
      data: {
        status: 'PENDING'  // Set to PENDING temporarily
      }
    })
    
    console.log(`Updated ${updateResult.count} work orders to null status`)
    
    // Get updated status counts
    const updatedStatusCounts = await prisma.unifiedWorkOrder.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log('After migration:', updatedStatusCounts)
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateStatuses()
