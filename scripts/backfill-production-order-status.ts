/**
 * Backfill script to populate status for existing production orders
 * Run with: npx tsx scripts/backfill-production-order-status.ts
 */

import { prisma } from '../src/lib/prisma'
import { ProductionOrderStatus } from '@prisma/client'

async function backfillStatus() {
  console.log('Starting status backfill for production orders...')
  
  // Get all orders without status
  const orders = await prisma.productionOrder.findMany({
    where: { status: null },
    include: { worklogs: true }
  })
  
  console.log(`Found ${orders.length} orders without status`)
  
  let updated = 0
  
  for (const order of orders) {
    const hasWorklog = order.worklogs.length > 0
    const completed = Boolean(order.completionDate)
    
    let status: ProductionOrderStatus
    if (completed) {
      status = ProductionOrderStatus.COMPLETED
    } else if (hasWorklog) {
      status = ProductionOrderStatus.IN_PROGRESS
    } else {
      status = ProductionOrderStatus.NOT_STARTED
    }
    
    await prisma.productionOrder.update({
      where: { id: order.id },
      data: {
        status,
        statusUpdatedAt: new Date()
      }
    })
    
    updated++
  }
  
  console.log(`Updated ${updated} orders`)
  console.log('Backfill complete!')
}

backfillStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

