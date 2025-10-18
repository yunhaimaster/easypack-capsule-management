import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { jsonSuccess, jsonError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.productionOrder.findMany({
      where: {
        completionDate: null // 未完成的订单
      },
      select: {
        id: true,
        customerName: true,
        productName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return jsonSuccess({
      orders: orders.map(order => ({
        id: order.id,
        customerName: order.customerName,
        productName: order.productName,
        displayName: `${order.customerName} - ${order.productName}`
      }))
    })
  } catch (error) {
    logger.error('載入未完成訂單錯誤', {
      error: error instanceof Error ? error.message : String(error),
    })

    return jsonError(500, {
      code: 'INCOMPLETE_ORDERS_FETCH_FAILED',
      message: '載入未完成訂單失敗',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
