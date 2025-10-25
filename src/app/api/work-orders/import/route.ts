/**
 * Work Orders Import API
 * 
 * POST /api/work-orders/import - Import work orders from CSV/XLSX with validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/middleware/work-order-auth'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { validateImportData, mapRowToWorkOrder, ValidationLevel } from '@/lib/import/import-parser'
import { matchUser } from '@/lib/import/user-matcher'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for large imports

/**
 * Import result structure
 */
interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ row: number; error: string }>
  warnings: Array<{ row: number; message: string }>
}

/**
 * POST /api/work-orders/import
 * 
 * Import work orders from parsed CSV/XLSX data with validation and duplicate detection.
 * 
 * Accessible by MANAGER+ (managers and admins only)
 * 
 * Request body:
 * - data: { headers: string[], rows: Array<Record<string, unknown>> }
 * - userMappings: Record<string, string> (imported name → user ID)
 * - dryRun: boolean (default: true) - if true, only validate, don't import
 * 
 * Returns:
 * - If dryRun: Validation results with errors/warnings
 * - If not dryRun: Import results with counts
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

    // Authorization check - IMPORT permission required
    if (!hasPermission(session.user.role, 'IMPORT')) {
      return NextResponse.json(
        { success: false, error: '權限不足' },
        { status: 403 }
      )
    }

    // Parse FormData (file upload)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const dryRun = formData.get('dryRun') === 'false' ? false : true

    if (!file) {
      return NextResponse.json(
        { success: false, error: '請選擇要匯入的文件' },
        { status: 400 }
      )
    }

    // Parse file based on type
    let data: { headers: string[], rows: Array<Record<string, unknown>> }
    
    try {
      const fileBuffer = await file.arrayBuffer()
      const fileName = file.name.toLowerCase()
      
      if (fileName.endsWith('.csv')) {
        // Parse CSV
        const csvText = new TextDecoder('utf-8').decode(fileBuffer)
        const parseResult = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        })
        
        if (parseResult.errors.length > 0) {
          return NextResponse.json(
            { success: false, error: `CSV解析錯誤: ${parseResult.errors[0].message}` },
            { status: 400 }
          )
        }
        
        data = {
          headers: parseResult.meta.fields || [],
          rows: parseResult.data as Array<Record<string, unknown>>
        }
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        if (jsonData.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Excel文件為空或格式不正確' },
            { status: 400 }
          )
        }
        
        const headers = jsonData[0] as string[]
        
        // Normalize headers (remove \r\n line breaks from multi-line Excel headers)
        const normalizedHeaders = headers.map(h => {
          if (typeof h === 'string') {
            return h.trim().replace(/[\r\n]+/g, '')
          }
          return String(h || '').trim()
        })
        
        const rows = (jsonData.slice(1) as any[][]).map((row: any[]) => {
          const obj: Record<string, unknown> = {}
          normalizedHeaders.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
        
        data = { headers: normalizedHeaders, rows }
      } else {
        return NextResponse.json(
          { success: false, error: '不支援的文件格式，請使用 CSV 或 XLSX' },
          { status: 400 }
        )
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError)
      return NextResponse.json(
        { success: false, error: '文件解析失敗，請檢查文件格式' },
        { status: 400 }
      )
    }

    if (!data || !data.headers || !data.rows) {
      return NextResponse.json(
        { success: false, error: '無效的匯入資料格式' },
        { status: 400 }
      )
    }

    // Fetch existing job numbers for duplicate detection
    const existingWorkOrders = await prisma.unifiedWorkOrder.findMany({
      select: { jobNumber: true }
    })
    const existingJobNumbers = new Set(
      existingWorkOrders
        .map(wo => wo.jobNumber)
        .filter((jn): jn is string => jn !== null)  // Filter out nulls and narrow type
    )

    // Validate import data
    const validationResult = await validateImportData(data, existingJobNumbers)

    // If dry run, return validation results only
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        validation: validationResult,
        debug: {
          headersFound: data.headers,
          totalRows: data.rows.length,
          sampleRow: data.rows[0] // First row for debugging
        }
      })
    }

    // Check for blocking errors
    const blockingErrors = validationResult.details.filter(e => e.level === ValidationLevel.BLOCKING)
    if (blockingErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '匯入資料包含錯誤，請修正後重試',
          validation: validationResult
        },
        { status: 400 }
      )
    }

    // Fetch all users for matching
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        phoneE164: true
      }
    })

    // Generate user mappings automatically
    const userMappings: Record<string, string> = {}
    for (const row of data.rows) {
      const personInCharge = row['負責人'] || row['personInCharge']
      if (personInCharge && typeof personInCharge === 'string') {
        const matchedUser = matchUser(personInCharge, users)
        if (matchedUser && matchedUser.matchedUser) {
          userMappings[personInCharge] = matchedUser.matchedUser.id
        }
      }
    }

    // Process import in transaction
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      warnings: []
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i]
        const rowNum = i + 2 // +2 for header and 0-index

        try {
          // Skip completed orders (user's Excel already cleaned, but handle gracefully)
          if (row.isCompleted && String(row.isCompleted).trim() === '是') {
            result.warnings.push({
              row: rowNum,
              message: '已完成的工作單，跳過不匯入'
            })
            result.skipped++
            continue
          }

          // Map row to work order data
          const workOrderData = mapRowToWorkOrder(row)

          // Match person in charge
          const personInChargeName = row.personInCharge as string
          let personInChargeId: string | null = null

          if (personInChargeName) {
            // Check if manually mapped
            if (userMappings[personInChargeName]) {
              personInChargeId = userMappings[personInChargeName]
            } else {
              // Try fuzzy matching
              const matchResult = matchUser(personInChargeName, users)
              if (matchResult.matchedUser && (matchResult.confidence === 'exact' || matchResult.confidence === 'high')) {
                personInChargeId = matchResult.matchedUser.id
              } else {
                result.errors.push({
                  row: rowNum,
                  error: `無法匹配負責人 "${personInChargeName}"，請提供用戶映射`
                })
                result.skipped++
                continue
              }
            }
          } else {
            result.errors.push({
              row: rowNum,
              error: '缺少負責人資訊'
            })
            result.skipped++
            continue
          }

          // Check duplicate jobNumber (final check before insert)
          const duplicate = await tx.unifiedWorkOrder.findUnique({
            where: { jobNumber: workOrderData.jobNumber as string },
            select: { id: true }
          })

          if (duplicate) {
            result.warnings.push({
              row: rowNum,
              message: `JOB標號 "${workOrderData.jobNumber}" 已存在，跳過此行`
            })
            result.skipped++
            continue
          }

          // Create work order
          await tx.unifiedWorkOrder.create({
            data: {
              ...workOrderData,
              personInChargeId,
              createdBy: session.userId
            } as never // Type assertion needed due to dynamic data
          })

          result.imported++
        } catch (error) {
          console.error(`[Import] Error importing row ${rowNum}:`, error)
          result.errors.push({
            row: rowNum,
            error: error instanceof Error ? error.message : '未知錯誤'
          })
          result.skipped++
        }
      }

      // If too many errors, rollback
      if (result.errors.length > data.rows.length * 0.5) {
        throw new Error('匯入失敗率超過50%，交易已回滾')
      }
    })

    // Get audit context
    const auditContext = await getUserContextFromRequest(request)

    // Log audit action
    await logAudit({
      action: AuditAction.WORK_ORDER_IMPORTED,
      userId: session.userId,
      phone: session.user.phoneE164,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors.length,
        warnings: result.warnings.length
      }
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[API] POST /api/work-orders/import error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '匯入工作單失敗'
      },
      { status: 500 }
    )
  }
}

