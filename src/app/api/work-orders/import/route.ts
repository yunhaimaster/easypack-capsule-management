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
        
        console.log('[Import] Excel parsing started')
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        console.log('[Import] jsonData length:', jsonData.length)
        console.log('[Import] First row (headers):', jsonData[0])
        
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
        
        console.log('[Import] Normalized headers:', normalizedHeaders)
        console.log('[Import] Data rows to process:', jsonData.length - 1)
        
        const rows = (jsonData.slice(1) as any[][]).map((row: any[]) => {
          const obj: Record<string, unknown> = {}
          normalizedHeaders.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
        
        console.log('[Import] Rows array length:', rows.length)
        console.log('[Import] First row object keys:', rows[0] ? Object.keys(rows[0]).length : 0)
        console.log('[Import] First row object sample:', rows[0] ? Object.entries(rows[0]).slice(0, 3) : 'No rows')
        
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

    // Map rows to internal field names for validation (so validators can read customerName, workType, etc.)
    const mappedRowsForValidation = data.rows.map((r) => mapRowToWorkOrder(r))
    const mappedDataForValidation = { headers: data.headers, rows: mappedRowsForValidation }

    // Validate import data using mapped rows
    const validationResult = await validateImportData(mappedDataForValidation, existingJobNumbers)

    // If dry run, return validation results only
    if (dryRun) {
      // Add detailed column mapping debug
      console.log('[Import] Column Mapping Debug:')
      console.log('Headers found:', data.headers)
      console.log('Total rows:', data.rows.length)
      
      if (data.rows.length > 0) {
        console.log('\n=== FIRST DATA ROW (ROW 2 IN EXCEL) ===')
        console.log('Raw row object keys:', Object.keys(data.rows[0]))
        console.log('Raw row object (first 10 fields):')
        Object.entries(data.rows[0]).slice(0, 10).forEach(([key, value]) => {
          console.log(`  "${key}": ${JSON.stringify(value)} (${typeof value})`)
        })
        
        // Test the mapping function
        console.log('\n=== AFTER APPLYING mapRowToWorkOrder ===')
        const mappedRow = mapRowToWorkOrder(data.rows[0])
        console.log('Mapped row (first 10 fields):')
        Object.entries(mappedRow).slice(0, 10).forEach(([key, value]) => {
          console.log(`  "${key}": ${JSON.stringify(value)} (${typeof value})`)
        })
      }
      
      return NextResponse.json({
        success: true,
        dryRun: true,
        validation: validationResult,
        debug: {
          headersFound: data.headers,
          totalRows: data.rows.length,
          firstDataRow: data.rows[0], // Complete first row
          firstDataRowKeys: Object.keys(data.rows[0] || {}),
          // Show what the row looks like after mapping
          afterMapping: data.rows[0] ? mapRowToWorkOrder(data.rows[0]) : null
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
          const personInChargeName = row['負責人'] as string || row.personInCharge as string
          let personInChargeId: string | null = null

          if (personInChargeName && String(personInChargeName).trim() !== '') {
            // Check if manually mapped
            if (userMappings[personInChargeName]) {
              personInChargeId = userMappings[personInChargeName]
            } else {
              // Try fuzzy matching
              const matchResult = matchUser(personInChargeName, users)
              if (matchResult.matchedUser && (matchResult.confidence === 'exact' || matchResult.confidence === 'high')) {
                personInChargeId = matchResult.matchedUser.id
              } else {
                // INFO: Can't match person, will be set to null
                result.warnings.push({
                  row: rowNum,
                  message: `無法匹配負責人 "${personInChargeName}"，將設為未指定`
                })
                personInChargeId = null
              }
            }
          } else {
            // INFO: No person in charge provided, will be set to null
            personInChargeId = null
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

          // Create work order - Clean data to match Prisma schema exactly
          const { personInCharge, ...workOrderDataForDb } = workOrderData as any
          
          // Helper function to safely parse dates (including Excel serial numbers)
          const safeParseDate = (value: any): Date | null => {
            if (!value) return null
            
            console.log(`[Import] Processing date value: "${value}" (type: ${typeof value})`)
            
            // Check if it's an Excel serial number (numeric value between 1 and 100000)
            const numValue = Number(value)
            if (!isNaN(numValue) && numValue >= 1 && numValue <= 100000) {
              console.log(`[Import] Detected Excel serial number: ${numValue}`)
              
              try {
                // Method 1: Standard Excel conversion (1900 epoch)
                const excelEpoch1900 = new Date(1900, 0, 1) // January 1, 1900
                const daysSinceEpoch1900 = numValue - 2 // Adjust for Excel's leap year bug
                const resultDate1900 = new Date(excelEpoch1900.getTime() + (daysSinceEpoch1900 * 24 * 60 * 60 * 1000))
                
                // Method 2: Alternative Excel conversion (1904 epoch - used on Mac)
                const excelEpoch1904 = new Date(1904, 0, 1) // January 1, 1904
                const daysSinceEpoch1904 = numValue - 1
                const resultDate1904 = new Date(excelEpoch1904.getTime() + (daysSinceEpoch1904 * 24 * 60 * 60 * 1000))
                
                console.log(`[Import] 1900 epoch conversion: ${resultDate1900.toISOString()}`)
                console.log(`[Import] 1904 epoch conversion: ${resultDate1904.toISOString()}`)
                
                // Choose the more reasonable date (between 1900 and 2100)
                const now = new Date()
                const year1900 = new Date(1900, 0, 1)
                const year2100 = new Date(2100, 0, 1)
                
                let resultDate = resultDate1900
                if (resultDate1900 < year1900 || resultDate1900 > year2100) {
                  console.log(`[Import] 1900 epoch result out of range, trying 1904 epoch`)
                  resultDate = resultDate1904
                }
                
                if (resultDate < year1900 || resultDate > year2100) {
                  console.log(`[Import] Both conversions out of range, using current date`)
                  resultDate = now
                }
                
                // Validate the result
                if (isNaN(resultDate.getTime())) {
                  console.log(`[Import] Invalid date result, using current date`)
                  resultDate = now
                }
                
                console.log(`[Import] Final Excel date conversion: ${resultDate.toISOString()}`)
                return resultDate
              } catch (error) {
                console.log(`[Import] Excel conversion error:`, error)
                return null
              }
            }
            
            // Try regular date parsing for non-serial numbers
            try {
              const date = new Date(value)
              if (isNaN(date.getTime())) {
                console.log(`[Import] Invalid date string: "${value}"`)
                return null
              }
              console.log(`[Import] Regular date parsing: ${date.toISOString()}`)
              return date
            } catch (error) {
              console.log(`[Import] Date parsing error:`, error)
              return null
            }
          }
          
          // Helper function to safely parse numbers
          const safeParseNumber = (value: any): number | null => {
            if (!value) return null
            const num = Number(value)
            return isNaN(num) ? null : num
          }
          
          // Helper function to validate enum values
          const validateWorkType = (value: any): 'PRODUCTION' | 'PACKAGING' | 'PRODUCTION_PACKAGING' | 'WAREHOUSING' => {
            const validTypes: ('PRODUCTION' | 'PACKAGING' | 'PRODUCTION_PACKAGING' | 'WAREHOUSING')[] = ['PRODUCTION', 'PACKAGING', 'PRODUCTION_PACKAGING', 'WAREHOUSING']
            return validTypes.includes(value as any) ? value as any : 'PRODUCTION'
          }
          
          const validateStatus = (value: any): 'DRAFT' | 'PENDING' | 'DATA_COMPLETE' | 'NOTIFIED' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED' => {
            const validStatuses: ('DRAFT' | 'PENDING' | 'DATA_COMPLETE' | 'NOTIFIED' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED')[] = ['DRAFT', 'PENDING', 'DATA_COMPLETE', 'NOTIFIED', 'PAID', 'SHIPPED', 'COMPLETED', 'ON_HOLD', 'CANCELLED']
            return validStatuses.includes(value as any) ? value as any : 'PENDING'
          }
          
          // Create clean data object with only valid Prisma fields and correct types
          const cleanData = {
            // Required fields with validation
            customerName: String(workOrderDataForDb.customerName || '').trim().substring(0, 200),
            workType: validateWorkType(workOrderDataForDb.workType),
            workDescription: String(workOrderDataForDb.workDescription || '').trim() || '（匯入時無描述，請手動補充）',
            
            // Optional fields with proper types and validation
            jobNumber: workOrderDataForDb.jobNumber ? String(workOrderDataForDb.jobNumber).trim().substring(0, 50) : null,
            markedDate: safeParseDate(workOrderDataForDb.markedDate) || new Date(),
            status: validateStatus(workOrderDataForDb.status),
            
            // VIP flags with safe boolean conversion
            isCustomerServiceVip: Boolean(workOrderDataForDb.isCustomerServiceVip),
            isBossVip: Boolean(workOrderDataForDb.isBossVip),
            isNewProductVip: Boolean(workOrderDataForDb.isNewProductVip),
            isComplexityVip: Boolean(workOrderDataForDb.isComplexityVip),
            
            // Material dates with safe parsing
            expectedProductionMaterialsDate: safeParseDate(workOrderDataForDb.expectedProductionMaterialsDate),
            expectedPackagingMaterialsDate: safeParseDate(workOrderDataForDb.expectedPackagingMaterialsDate),
            productionMaterialsReady: Boolean(workOrderDataForDb.productionMaterialsReady),
            packagingMaterialsReady: Boolean(workOrderDataForDb.packagingMaterialsReady),
            
            // Quantities with safe number conversion
            productionQuantity: safeParseNumber(workOrderDataForDb.productionQuantity),
            packagingQuantity: safeParseNumber(workOrderDataForDb.packagingQuantity),
            productionQuantityStat: workOrderDataForDb.productionQuantityStat ? String(workOrderDataForDb.productionQuantityStat).substring(0, 20) : null,
            packagingQuantityStat: workOrderDataForDb.packagingQuantityStat ? String(workOrderDataForDb.packagingQuantityStat).substring(0, 20) : null,
            
            // Delivery dates with safe parsing
            requestedDeliveryDate: safeParseDate(workOrderDataForDb.requestedDeliveryDate),
            internalExpectedDate: safeParseDate(workOrderDataForDb.internalExpectedDate),
            
            // Status flags with safe boolean conversion
            isUrgent: Boolean(workOrderDataForDb.isUrgent),
            productionStarted: Boolean(workOrderDataForDb.productionStarted),
            isCompleted: Boolean(workOrderDataForDb.isCompleted),
            
            // Legacy fields (deprecated but still in schema) with safe parsing
            yearCategory: workOrderDataForDb.yearCategory ? String(workOrderDataForDb.yearCategory).substring(0, 50) : null,
            expectedCompletionDate: safeParseDate(workOrderDataForDb.expectedCompletionDate),
            dataCompleteDate: safeParseDate(workOrderDataForDb.dataCompleteDate),
            notifiedDate: safeParseDate(workOrderDataForDb.notifiedDate),
            paymentReceivedDate: safeParseDate(workOrderDataForDb.paymentReceivedDate),
            shippedDate: safeParseDate(workOrderDataForDb.shippedDate),
            internalDeliveryTime: workOrderDataForDb.internalDeliveryTime ? String(workOrderDataForDb.internalDeliveryTime).substring(0, 100) : null,
            customerRequestedTime: workOrderDataForDb.customerRequestedTime ? String(workOrderDataForDb.customerRequestedTime).substring(0, 100) : null,
            notes: workOrderDataForDb.notes ? String(workOrderDataForDb.notes).substring(0, 1000) : null,
            
            // Additional fields
            personInChargeId,
            createdBy: session.userId
          }
          
          // Debug: Log the clean data being sent to Prisma
          console.log(`[Import] Creating work order for row ${rowNum}:`)
          console.log('  - customerName:', cleanData.customerName, '(length:', cleanData.customerName.length, ')')
          console.log('  - workType:', cleanData.workType)
          console.log('  - workDescription length:', cleanData.workDescription.length)
          console.log('  - personInChargeId:', cleanData.personInChargeId)
          console.log('  - markedDate:', cleanData.markedDate?.toISOString())
          console.log('  - expectedProductionMaterialsDate:', cleanData.expectedProductionMaterialsDate?.toISOString())
          console.log('  - expectedPackagingMaterialsDate:', cleanData.expectedPackagingMaterialsDate?.toISOString())
          console.log('  - requestedDeliveryDate:', cleanData.requestedDeliveryDate?.toISOString())
          console.log('  - internalExpectedDate:', cleanData.internalExpectedDate?.toISOString())
          console.log('  - Clean data keys:', Object.keys(cleanData))
          
          // Validate required fields before Prisma create
          if (!cleanData.customerName || cleanData.customerName.length === 0) {
            throw new Error('Customer name is required')
          }
          if (!cleanData.workDescription || cleanData.workDescription.length < 10) {
            throw new Error('Work description must be at least 10 characters')
          }
          
          await tx.unifiedWorkOrder.create({
            data: cleanData
          })

          result.imported++
        } catch (error) {
          console.error(`[Import] Error importing row ${rowNum}:`, error)
          
          // Log detailed Prisma error information
          if (error instanceof Error) {
            console.error(`[Import] Error message:`, error.message)
            console.error(`[Import] Error stack:`, error.stack)
            
            // Check if it's a Prisma validation error
            if (error.message.includes('Invalid') || error.message.includes('Unknown argument')) {
              console.error(`[Import] Prisma validation error detected`)
              console.error(`[Import] Row data that caused error:`, row)
            }
          }
          
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

    const message = error instanceof Error ? error.message : '匯入工作單失敗'
    const isBusinessRollback = typeof error === 'object' && error !== null && 'message' in (error as any)
      && String((error as any).message).includes('匯入失敗率超過')

    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: isBusinessRollback ? 400 : 500 }
    )
  }
}

