import { NextResponse } from 'next/server'
import { ProductionOrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { jsonSuccess, jsonError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes cache

/**
 * GET /api/orders/stats
 * 獲取膠囊訂單統計數據
 * Returns: total, completed, inProgress, notStarted counts
 */
export async function GET() {
  try {
    // Parallel queries for all stats for better performance
    const [total, completed, inProgress, notStarted] = await Promise.all([
      // Total orders count
      prisma.productionOrder.count(),
      
      // Completed orders (completionDate is not null, matching API filter logic)
      prisma.productionOrder.count({
        where: {
          completionDate: { not: null }
        }
      }),
      
      // In progress orders
      prisma.productionOrder.count({
        where: {
          status: ProductionOrderStatus.IN_PROGRESS
        }
      }),
      
      // Not started orders
      prisma.productionOrder.count({
        where: {
          status: ProductionOrderStatus.NOT_STARTED
        }
      })
    ])

    return jsonSuccess({
      total,
      completed,
      inProgress,
      notStarted
    })

  } catch (error) {
    logger.error('獲取訂單統計錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return jsonError(500, {
      code: 'ORDER_STATS_FETCH_FAILED',
      message: '獲取訂單統計失敗',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

