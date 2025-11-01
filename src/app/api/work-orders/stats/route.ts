import { NextResponse } from 'next/server'
import { WorkOrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { jsonSuccess, jsonError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes cache

/**
 * GET /api/work-orders/stats
 * 獲取工作單統計數據
 * Returns: total, completed, paused, cancelled, ongoing counts
 */
export async function GET() {
  try {
    // Parallel queries for all stats for better performance
    const [total, completed, paused, cancelled, ongoing] = await Promise.all([
      // Total work orders count
      prisma.unifiedWorkOrder.count(),
      
      // Completed work orders (isCompleted = true OR status = COMPLETED, matching "已出貨" smart filter logic)
      // This matches the API logic when showCompleted is true: includes both isCompleted=true and status=COMPLETED
      prisma.unifiedWorkOrder.count({
        where: {
          OR: [
            { isCompleted: true },
            { status: WorkOrderStatus.COMPLETED }
          ]
        }
      }),
      
      // Paused work orders
      prisma.unifiedWorkOrder.count({
        where: {
          status: WorkOrderStatus.PAUSED
        }
      }),
      
      // Cancelled work orders
      prisma.unifiedWorkOrder.count({
        where: {
          status: WorkOrderStatus.CANCELLED
        }
      }),
      
      // Ongoing work orders: status is NULL AND isCompleted = false
      // This excludes completed orders (isCompleted=true or status=COMPLETED)
      // This matches "進行中" which is status = null (not PAUSED, not COMPLETED, not CANCELLED)
      prisma.unifiedWorkOrder.count({
        where: {
          AND: [
            { status: null },
            { isCompleted: false }
          ]
        }
      })
    ])

    return jsonSuccess({
      total,
      completed,
      paused,
      cancelled,
      ongoing
    })

  } catch (error) {
    logger.error('獲取工作單統計錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return jsonError(500, {
      code: 'WORK_ORDER_STATS_FETCH_FAILED',
      message: '獲取工作單統計失敗',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

