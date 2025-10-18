import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { jsonSuccess, jsonError } from '@/lib/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const [customers, products, ingredients, capsuleTypes] = await Promise.all([
      prisma.productionOrder.findMany({
        select: { customerName: true },
        distinct: ['customerName'],
        orderBy: { customerName: 'asc' },
      }),
      prisma.productionOrder.findMany({
        select: { productName: true },
        distinct: ['productName'],
        orderBy: { productName: 'asc' },
      }),
      prisma.ingredient.findMany({
        select: { materialName: true },
        distinct: ['materialName'],
        orderBy: { materialName: 'asc' },
      }),
      prisma.productionOrder.findMany({
        select: { capsuleType: true },
        distinct: ['capsuleType'],
        where: { capsuleType: { not: null } },
        orderBy: { capsuleType: 'asc' },
      }),
    ])

    return jsonSuccess({
      customers: customers.map((item) => item.customerName).filter(Boolean),
      products: products.map((item) => item.productName).filter(Boolean),
      ingredients: ingredients.map((item) => item.materialName).filter(Boolean),
      capsuleTypes: capsuleTypes.map((item) => item.capsuleType).filter(Boolean),
    })
  } catch (error) {
    logger.error('載入訂單下拉選項錯誤', {
      error: error instanceof Error ? error.message : String(error),
    })

    return jsonError(500, {
      code: 'ORDERS_OPTIONS_FAILED',
      message: '載入訂單篩選選項失敗',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
