/**
 * Work Orders Export API
 * 
 * POST /api/work-orders/export - Export work orders to CSV or XLSX
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { exportOptionsSchema } from '@/lib/validations/work-order-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/work-order-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { exportWorkOrdersToXLSX, getExportFilename } from '@/lib/export/xlsx-exporter'
import { exportWorkOrdersToCSV } from '@/lib/export/csv-exporter'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for large exports

/**
 * POST /api/work-orders/export
 * 
 * Export work orders to CSV or XLSX format with proper Chinese encoding.
 * 
 * Accessible by EMPLOYEE+ (all authenticated users)
 * 
 * Request body:
 * - format: 'csv' | 'xlsx'
 * - columns: string[] (field names to include)
 * - workOrderIds?: string[] (optional: export specific orders only)
 * - includeLinkedOrders?: boolean (include capsulation orders)
 * 
 * Returns:
 * - File download with proper headers and Chinese-safe encoding
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未授權' },
        { status: 401 }
      )
    }

    // Authorization check - EXPORT permission required
    if (!hasPermission(session.user.role, 'EXPORT')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedOptions = exportOptionsSchema.parse(body)

    const { format, columns, workOrderIds, includeLinkedOrders } = validatedOptions

    // Build query
    const where = workOrderIds && workOrderIds.length > 0 
      ? { id: { in: workOrderIds } } 
      : {}

    // Fetch work orders with necessary relations
    const workOrders = await prisma.unifiedWorkOrder.findMany({
      where,
      include: {
        personInCharge: {
          select: {
            id: true,
            nickname: true,
            phoneE164: true
          }
        },
        capsulationOrder: includeLinkedOrders ? {
          include: {
            customerService: {
              select: {
                id: true,
                nickname: true,
                phoneE164: true
              }
            }
          }
        } : false
      },
      orderBy: { createdAt: 'desc' }
    })

    if (workOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: '沒有符合條件的工作單' },
        { status: 404 }
      )
    }

    // Generate export file
    let fileBuffer: Buffer | string
    let mimeType: string
    let filename: string

    if (format === 'xlsx') {
      fileBuffer = exportWorkOrdersToXLSX(workOrders as never[], columns)
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = getExportFilename('xlsx')
    } else {
      fileBuffer = Buffer.from(exportWorkOrdersToCSV(workOrders as never[], columns), 'utf-8')
      mimeType = 'text/csv;charset=utf-8'
      filename = getExportFilename('csv')
    }

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.WORK_ORDER_EXPORTED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        format,
        count: workOrders.length,
        columns: columns.length,
        specificOrders: !!workOrderIds
      }
    })

    // Return file download
    return new NextResponse(fileBuffer as never, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('[API] POST /api/work-orders/export error:', error)
    
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        {
          success: false,
          error: '驗證失敗',
          details: error
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '匯出工作單失敗'
      },
      { status: 500 }
    )
  }
}

