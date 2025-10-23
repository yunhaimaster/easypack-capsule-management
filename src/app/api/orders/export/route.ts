import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateCSV } from '@/lib/utils'
import jsPDF from 'jspdf'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { format, includeIngredients = false, dateRange, filters } = body

    // Get user context for audit logging
    const context = await getUserContextFromRequest(request)

    const where: Record<string, any> = {}
    const searchConditions: any[] = []

    if (filters?.customerName) {
      searchConditions.push({
        customerName: {
          contains: filters.customerName,
          mode: 'insensitive'
        }
      })
    }

    if (filters?.productName) {
      searchConditions.push({
        productName: {
          contains: filters.productName,
          mode: 'insensitive'
        }
      })
    }

    if (filters?.ingredientName) {
      searchConditions.push({
        ingredients: {
          some: {
            materialName: {
              contains: filters.ingredientName,
              mode: 'insensitive'
            }
          }
        }
      })
    }

    if (filters?.capsuleType) {
      searchConditions.push({
        capsuleType: {
          contains: filters.capsuleType,
          mode: 'insensitive'
        }
      })
    }

    if (searchConditions.length > 0) {
      where.AND = searchConditions
    }

    if (dateRange) {
      where.createdAt = {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to)
      }
    }

    if (filters?.minQuantity !== undefined || filters?.maxQuantity !== undefined) {
      where.productionQuantity = {}
      if (filters.minQuantity !== undefined) {
        where.productionQuantity.gte = Number(filters.minQuantity)
      }
      if (filters.maxQuantity !== undefined) {
        where.productionQuantity.lte = Number(filters.maxQuantity)
      }
    }

    if (filters?.isCompleted !== undefined) {
      if (filters.isCompleted) {
        where.completionDate = { not: null }
      } else {
        where.completionDate = null
      }
    }

    const orders = await prisma.productionOrder.findMany({
      where,
      include: {
        ingredients: includeIngredients,
        worklogs: {
          orderBy: { workDate: 'asc' }
        }
      },
      orderBy: {
        [filters?.sortBy ?? 'createdAt']: filters?.sortOrder ?? 'desc'
      }
    })

    // Log order export
    await logAudit({
      action: AuditAction.ORDER_EXPORTED,
      userId: context.userId,
      phone: context.phone,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: {
        format,
        orderCount: orders.length,
        includeIngredients,
        hasFilters: !!filters,
        hasDateRange: !!dateRange
      }
    })

    if (format === 'csv') {
      const headers = [
        '建檔日期',
        '客戶名稱',
        '產品代號',
        '訂單數量',
        '單粒總重量(mg)',
        '批次總重量(mg)',
        '完工日期',
        '客服',
        '實際生產數量',
        '材料可做數量',
        '累積工時 (工時)'
      ]

      if (includeIngredients) {
        headers.push('原料明細')
      }

      const csvData = orders.map(order => {
        const totalWorkUnits = order.worklogs?.reduce((sum, log) => sum + (log.calculatedWorkUnits || 0), 0) ?? 0

        const row = [
          order.createdAt.toISOString().split('T')[0],
          order.customerName,
          order.productName,
          order.productionQuantity.toString(),
          order.unitWeightMg.toString(),
          order.batchTotalWeightMg.toString(),
          order.completionDate ? 
            (order.completionDate instanceof Date ? 
              order.completionDate.toISOString().split('T')[0] : 
              order.completionDate) : '',
          order.customerService || '',
          order.actualProductionQuantity != null ? order.actualProductionQuantity.toString() : '',
          order.materialYieldQuantity != null ? order.materialYieldQuantity.toString() : '',
          totalWorkUnits.toString()
        ]

        if (includeIngredients) {
          const ingredientsText = order.ingredients
            .map(ing => `${ing.materialName}: ${ing.unitContentMg}mg`)
            .join('; ')
          row.push(ingredientsText)
        }

        return row
      })

      // 添加 BOM 以支持中文
      const csvContent = '\uFEFF' + generateCSV(csvData, headers)
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="production-orders-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    if (format === 'pdf') {
      const doc = new jsPDF()
      
      // 標題
      doc.setFontSize(16)
      doc.text('Capsule Production Records', 20, 20)
      
      // 表格標題
      const tableHeaders = ['Date', 'Customer', 'Product Code', 'Quantity', 'Unit Weight(mg)', 'Status']
      const tableData = orders.map(order => [
        order.createdAt.toISOString().split('T')[0],
        order.customerName,
        order.productName,
        order.productionQuantity.toString(),
        order.unitWeightMg.toFixed(3),
        order.completionDate ? 'Completed' : 'Pending'
      ])

      // 簡單的表格實現
      let y = 40
      const rowHeight = 8
      const colWidths = [25, 30, 25, 20, 25, 20]

      // 表頭
      doc.setFontSize(10)
      let x = 20
      tableHeaders.forEach((header, i) => {
        doc.text(header, x, y)
        x += colWidths[i]
      })
      y += rowHeight

      // 表格內容
      tableData.forEach(row => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
        
        x = 20
        row.forEach((cell, i) => {
          doc.text(cell, x, y)
          x += colWidths[i]
        })
        y += rowHeight
      })

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="production-orders-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })
    }

    return NextResponse.json(
      { error: 'Unsupported format' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('Error exporting orders', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}
