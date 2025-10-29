/**
 * Manager Scheduling Table API - Export Operations
 * 
 * POST /api/manager-scheduling/export - Export scheduling table to Excel/CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exportSchedulingSchema } from '@/lib/validations/manager-scheduling-schemas'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/manager-scheduling-auth'
import { exportSchedulingToXLSX, exportSchedulingToCSV, getSchedulingExportFilename } from '@/lib/export/scheduling-exporter'

export const dynamic = 'force-dynamic'

/**
 * POST /api/manager-scheduling/export
 * 
 * Export scheduling table to Excel or CSV format.
 * Accessible by all authenticated users (EXPORT permission).
 * 
 * Body:
 * - format: 'csv' | 'xlsx'
 * - columns: string[] (optional, defaults to all)
 * - encoding: 'utf8' | 'utf8-bom' (defaults to 'utf8-bom')
 * 
 * Returns:
 * - File download (XLSX or CSV)
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
    const validatedData = exportSchedulingSchema.parse(body)

    // Fetch all scheduling entries
    const entries = await prisma.managerSchedulingEntry.findMany({
      orderBy: { priority: 'asc' },
      include: {
        workOrder: {
          select: {
            id: true,
            createdAt: true,
            customerName: true,
            personInChargeId: true,
            personInCharge: {
              select: {
                id: true,
                nickname: true,
                phoneE164: true
              }
            },
            workType: true,
            expectedProductionMaterialsDate: true,
            productionMaterialsReady: true,
            workDescription: true,
            productionQuantity: true,
            capsulationOrder: {
              select: {
                processIssues: true,
                qualityNotes: true
              }
            }
          }
        }
      }
    })

    // Transform to ManagerSchedulingEntry type
    const typedEntries = entries.map(entry => ({
      ...entry,
      workOrder: {
        ...entry.workOrder,
        personInCharge: entry.workOrder.personInCharge
      }
    })) as any[]

    // Export based on format
    let fileContent: Buffer | string
    let contentType: string
    let filename: string

    if (validatedData.format === 'xlsx') {
      fileContent = exportSchedulingToXLSX(typedEntries, validatedData.columns)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = getSchedulingExportFilename('xlsx')
    } else {
      fileContent = exportSchedulingToCSV(typedEntries, validatedData.columns)
      contentType = 'text/csv; charset=utf-8'
      filename = getSchedulingExportFilename('csv')
    }

    // Return file download
    return new NextResponse(fileContent as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('[API] POST /api/manager-scheduling/export error:', error)
    
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
        error: error instanceof Error ? error.message : '匯出失敗'
      },
      { status: 500 }
    )
  }
}

