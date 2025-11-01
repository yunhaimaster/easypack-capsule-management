import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'
import { exportToXLSX, STANDARD_EXPORT_HEADERS } from '@/lib/export/export-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get order with ingredients
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        ingredients: {
          orderBy: { unitContentMg: 'desc' } // Sort by unit content descending
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: '訂單不存在' },
        { status: 404 }
      )
    }

    // Format current date for export
    const exportDate = new Date().toISOString().split('T')[0]
    const formattedExportDate = new Date(order.createdAt).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })

    // Build Excel data structure
    const data: Record<string, string | number>[] = []
    
    // Order Info Section
    data.push({ '項目': '訂單資訊', '內容': '' })
    data.push({ '項目': '客戶名稱', '內容': order.customerName })
    data.push({ '項目': '產品名稱', '內容': order.productName })
    data.push({ '項目': '生產數量', '內容': order.productionQuantity })
    data.push({ '項目': '創建日期', '內容': formattedExportDate })
    data.push({ '項目': '導出日期', '內容': exportDate })
    
    // Empty separator row
    data.push({ '項目': '', '內容': '' })
    
    // Ingredients Table Header
    data.push({ '項目': '序號', '內容': '原料名稱', '補充': '單位含量(mg)' })
    
    // Ingredients rows
    order.ingredients.forEach((ingredient, idx) => {
      data.push({
        '項目': idx + 1,
        '內容': ingredient.materialName,
        '補充': ingredient.unitContentMg
      })
    })

    // Generate filename
    const filename = `${order.customerName}_${order.productName}_原料明細`
    
    // Create XLSX buffer with Chinese support
    const buffer = exportToXLSX(data, filename, '原料明細')

    // Audit logging
    const context = await getUserContextFromRequest(request)
    await logAudit({
      action: AuditAction.ORDER_EXPORTED,
      userId: context.userId,
      phone: context.phone,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: {
        orderId: order.id,
        customerName: order.customerName,
        productName: order.productName,
        ingredientCount: order.ingredients.length,
        exportFormat: 'XLSX'
      }
    })

    // Return XLSX file with proper headers
    return new NextResponse(buffer as never, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}_${exportDate}.xlsx"`,
        'Content-Length': buffer.length.toString(),
        ...STANDARD_EXPORT_HEADERS
      }
    })
  } catch (error) {
    console.error('[Export Ingredients] Error:', error)
    return NextResponse.json(
      { success: false, error: '導出失敗，請稍後重試' },
      { status: 500 }
    )
  }
}
