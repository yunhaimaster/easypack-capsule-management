/**
 * Import Parser for Work Orders
 * 
 * Parses and validates imported work order data from CSV/XLSX files.
 * Includes multi-level validation (BLOCKING, WARNING, INFO) and duplicate detection.
 */

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { normalizeColumnName, normalizeName, similarity } from '../export/encoding-utils'
import { WorkType, WorkOrderStatus } from '@prisma/client'

/**
 * Validation levels
 */
export enum ValidationLevel {
  BLOCKING = 'BLOCKING',   // Must fix before import
  WARNING = 'WARNING',      // Should review but can proceed
  INFO = 'INFO'            // Informational only
}

/**
 * Validation error structure
 */
export interface ValidationError {
  row: number
  field: string
  level: ValidationLevel
  message: string
}

/**
 * Import data structure
 */
export interface ImportData {
  headers: string[]
  rows: Array<Record<string, unknown>>
}

/**
 * Validation result structure
 */
export interface ImportValidationResult {
  valid: number
  warnings: number
  errors: number
  details: ValidationError[]
}

/**
 * Column mapping for Chinese headers to internal field names
 */
const COLUMN_MAPPINGS: Record<string, string> = {
  // Basic Info - Updated to match export
  '訂單編號': 'jobNumber',
  'JOB標號': 'jobNumber', // Legacy support
  'job標號': 'jobNumber', // Legacy support
  '創建日期': 'markedDate',
  '標記日期': 'markedDate', // Legacy support
  '編碼/日期': 'markedDate', // Excel format
  '填表日期': 'markedDate', // Form date
  '客戶名稱': 'customerName',
  '負責人': 'personInCharge',
  '工作類型': 'workDescription', // In some Excel files, this contains the description, not the type enum
  '狀態': 'status',
  '生產/包裝/標籤': 'workType', // Excel format
  '生產 / 包裝 / 倉務': 'workType', // Excel format (with spaces and 倉務)
  '生產/包裝/倉務': 'workType', // Excel format (no spaces, with 倉務)
  
  // VIP Flags - Updated to match export
  '客服VIP': 'isCustomerServiceVip',
  '老闆VIP': 'isBossVip',
  '智慧建議客戶VIP': 'isCustomerServiceVip', // Excel format
  '老闆建議客戶VIP': 'isBossVip', // Excel format
  '客服重要客戶VIP': 'isCustomerServiceVip', // Multi-line Excel header (after removing \r\n)
  '老板指定重要客戶VIP': 'isBossVip', // Multi-line Excel header (after removing \r\n)
  '新品VIP': 'isNewProductVip', // Legacy support
  '複雜度VIP': 'isComplexityVip', // Legacy support
  
  // Material Ready Status - New
  '預計生產物料到齊日期': 'expectedProductionMaterialsDate',
  '預計包裝物料到齊日期': 'expectedPackagingMaterialsDate',
  '預計齊料日期': 'expectedProductionMaterialsDate', // Excel format (general)
  '物料齊日期': 'expectedProductionMaterialsDate', // Excel format (simplified)
  '齊料日期': 'expectedProductionMaterialsDate', // Excel format (even more simplified)
  '生產物料齊': 'productionMaterialsReady',
  '生產物料已齊': 'productionMaterialsReady', // Excel format with 已
  '包裝物料齊': 'packagingMaterialsReady',
  '包裝物料已齊': 'packagingMaterialsReady', // Excel format with 已
  
  // Quantities (will be parsed to extract number + unit)
  '生產數量': 'productionQuantity',
  '生產數量（數粒）': 'productionQuantity', // Excel format with unit hint (full-width parens)
  '生產數量 (粒數)': 'productionQuantity', // Excel format with unit hint (half-width parens and space)
  '生產數量(粒數)': 'productionQuantity', // Excel format with unit hint (half-width parens no space)
  '包裝數量': 'packagingQuantity',
  
  // Delivery Dates - New
  '要求交貨日期': 'requestedDeliveryDate',
  '要求交貨期': 'requestedDeliveryDate', // Excel format
  '要求日期': 'requestedDeliveryDate', // Excel format (simplified)
  '內部預計交貨期': 'internalExpectedDate',
  '預計日期': 'internalExpectedDate', // Excel format (simplified)
  
  // Status Flags - New
  '客人要求加急': 'isUrgent',
  '已開生產線': 'productionStarted',
  '已開生產綫': 'productionStarted', // Excel format with 綫 (traditional character)
  '已經完成': 'isCompleted',
  
  // Description
  '工作描述': 'workDescription',
  
  // Legacy fields (deprecated but kept for compatibility)
  '年份類別': 'yearCategory',
  '預計完成日期': 'expectedCompletionDate',
  '資料齊全日期': 'dataCompleteDate',
  '通知日期': 'notifiedDate',
  '收數日期': 'paymentReceivedDate',
  '出貨日期': 'shippedDate',
  '內部交貨時間': 'internalDeliveryTime',
  '客戶要求時間': 'customerRequestedTime',
  '備註': 'notes',
  
  // Capsulation Order fields
  '產品名稱': 'productName',
  '膠囊顏色': 'capsuleColor',
  '膠囊尺寸': 'capsuleSize',
  '膠囊類型': 'capsuleType',
  '客服': 'customerService'
}

/**
 * Work type mappings (Chinese to enum)
 */
const WORK_TYPE_MAPPINGS: Record<string, WorkType> = {
  '包裝': WorkType.PACKAGING,
  '生產': WorkType.PRODUCTION,
  '生產+包裝': WorkType.PRODUCTION_PACKAGING,
  '生產＋包裝': WorkType.PRODUCTION_PACKAGING,
  '生產 + 包裝': WorkType.PRODUCTION_PACKAGING, // With spaces
  '生產 ＋ 包裝': WorkType.PRODUCTION_PACKAGING, // With spaces and full-width plus
  '倉務': WorkType.WAREHOUSING
}

/**
 * Status mappings (Chinese to enum)
 */
const STATUS_MAPPINGS: Record<string, WorkOrderStatus> = {
  '已完成': WorkOrderStatus.COMPLETED,
  '已取消': WorkOrderStatus.CANCELLED
}

/**
 * Parse quantity string with unit
 * 
 * Handles various formats:
 * - "480 瓶" → { quantity: 480, unit: "瓶" }
 * - "23,600粒" → { quantity: 23600, unit: "粒" }
 * - "60,000 sachets" → { quantity: 60000, unit: "sachets" }
 * - "480" → { quantity: 480, unit: null }
 * - "TBD" or empty → { quantity: null, unit: null }
 * 
 * @param value - The quantity string to parse
 * @returns Object with quantity (number | null) and unit (string | null)
 */
export function parseQuantityWithUnit(value: unknown): { quantity: number | null; unit: string | null } {
  if (!value || value === null || value === undefined) {
    return { quantity: null, unit: null }
  }

  const str = String(value).trim()
  
  // Handle empty, TBD, 待定, etc.
  if (str === '' || str.toLowerCase() === 'tbd' || str === '待定' || str === '-') {
    return { quantity: null, unit: null }
  }

  // Regex to extract number (with optional commas) and unit
  // Matches: number (with commas) + optional space + unit text
  const match = str.match(/^([0-9,]+(?:\.[0-9]+)?)\s*(.*)$/)
  
  if (!match) {
    // No number found, invalid format
    return { quantity: null, unit: null }
  }

  // Extract quantity (remove commas)
  const quantityStr = match[1].replace(/,/g, '')
  const quantity = Number(quantityStr)
  
  if (isNaN(quantity) || quantity < 0) {
    return { quantity: null, unit: null }
  }

  // Extract unit (trim whitespace)
  const unit = match[2].trim() || null

  return { quantity, unit }
}

/**
 * Parse CSV file to import data
 */
export function parseCSV(fileContent: string): ImportData {
  const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Normalize header (trim, normalize Chinese)
      const normalized = normalizeColumnName(header)
      // Map to internal field name
      return COLUMN_MAPPINGS[normalized] || normalized
    }
  })
  
  return {
    headers: result.meta.fields || [],
    rows: result.data as Array<Record<string, unknown>>
  }
}

/**
 * Parse XLSX file to import data
 */
export function parseXLSX(fileBuffer: Buffer): ImportData {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false
  }) as Array<Array<string | number>>
  
  if (data.length === 0) {
    return { headers: [], rows: [] }
  }
  
  // First row is headers
  const rawHeaders = data[0].map(h => String(h))
  const headers = rawHeaders.map(header => {
    const normalized = normalizeColumnName(header)
    return COLUMN_MAPPINGS[normalized] || normalized
  })
  
  // Rest are data rows
  const rows = data.slice(1).map(row => {
    const obj: Record<string, unknown> = {}
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : ''
    })
    return obj
  })
  
  return { headers, rows }
}

/**
 * Validate imported data
 * 
 * @param data - Parsed import data
 * @param existingJobNumbers - Set of existing job numbers in database
 * @returns Validation result with errors grouped by level
 */
export async function validateImportData(
  data: ImportData,
  existingJobNumbers: Set<string>
): Promise<ImportValidationResult> {
  const errors: ValidationError[] = []
  
  data.rows.forEach((row, index) => {
    const rowNum = index + 2 // +2 because: +1 for 0-index, +1 for header row
    
    // INFO: Skip completed orders (user's choice to exclude them)
    if (row.isCompleted && String(row.isCompleted).trim() === '是') {
      errors.push({
        row: rowNum,
        field: 'isCompleted',
        level: ValidationLevel.INFO,
        message: '已完成的工作單，建議不匯入（將被跳過）'
      })
    }
    
    // BLOCKING: Missing required fields
    if (!row.customerName || String(row.customerName).trim() === '') {
      errors.push({
        row: rowNum,
        field: 'customerName',
        level: ValidationLevel.BLOCKING,
        message: '客戶名稱為必填項'
      })
    }
    
    // WARNING: Missing work type (will default to PRODUCTION)
    if (!row.workType || String(row.workType).trim() === '') {
      errors.push({
        row: rowNum,
        field: 'workType',
        level: ValidationLevel.WARNING,
        message: '工作類型為空，將使用預設值（生產）'
      })
    }
    
    // NOTE: 不驗證工作描述內容或長度（依用戶要求）
    
    // WARNING: Duplicate jobNumber
    if (row.jobNumber && existingJobNumbers.has(String(row.jobNumber).trim())) {
      errors.push({
        row: rowNum,
        field: 'jobNumber',
        level: ValidationLevel.WARNING,
        message: `JOB標號 "${row.jobNumber}" 已存在於系統中`
      })
    }
    
    // WARNING: Invalid work type
    if (row.workType) {
      const workType = String(row.workType).trim()
      if (!WORK_TYPE_MAPPINGS[workType] && !Object.values(WorkType).includes(workType as WorkType)) {
        errors.push({
          row: rowNum,
          field: 'workType',
          level: ValidationLevel.WARNING,
          message: `無效的工作類型 "${workType}"，將使用預設值（生產）`
        })
      }
    }
    
    // WARNING: Invalid status
    if (row.status) {
      const status = String(row.status).trim()
      if (!STATUS_MAPPINGS[status] && !Object.values(WorkOrderStatus).includes(status as WorkOrderStatus)) {
        errors.push({
          row: rowNum,
          field: 'status',
          level: ValidationLevel.WARNING,
          message: `無效的狀態 "${status}"，將使用預設值（待處理）`
        })
      }
    }
    
    // WARNING: Invalid date format
    const dateFields = ['markedDate', 'expectedCompletionDate', 'dataCompleteDate', 'notifiedDate', 'paymentReceivedDate', 'shippedDate']
    dateFields.forEach(field => {
      if (row[field]) {
        const dateStr = String(row[field]).trim()
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) {
          errors.push({
            row: rowNum,
            field,
            level: ValidationLevel.WARNING,
            message: `無效的日期格式 "${dateStr}"`
          })
        }
      }
    })
    
    // WARNING: Invalid number format
    const numberFields = ['productionQuantity', 'packagingQuantity']
    numberFields.forEach(field => {
      if (row[field]) {
        const num = Number(row[field])
        if (isNaN(num) || num < 0) {
          errors.push({
            row: rowNum,
            field,
            level: ValidationLevel.WARNING,
            message: `無效的數量 "${row[field]}"，必須為正整數`
          })
        }
      }
    })
    
    // INFO: Missing optional person in charge
    if (!row.personInCharge || String(row.personInCharge).trim() === '') {
      errors.push({
        row: rowNum,
        field: 'personInCharge',
        level: ValidationLevel.INFO,
        message: '未指定負責人，需要在匯入時手動選擇'
      })
    }
  })
  
  // Count by level
  const blockingCount = errors.filter(e => e.level === ValidationLevel.BLOCKING).length
  const warningCount = errors.filter(e => e.level === ValidationLevel.WARNING).length
  
  // Count rows with blocking errors
  const rowsWithBlockingErrors = new Set(
    errors
      .filter(e => e.level === ValidationLevel.BLOCKING)
      .map(e => e.row)
  )
  
  const validCount = data.rows.length - rowsWithBlockingErrors.size
  
  return {
    valid: validCount,
    warnings: warningCount,
    errors: blockingCount,
    details: errors
  }
}

/**
 * Map imported row to work order create data
 * 
 * Handles data transformation and defaults
 */
export function mapRowToWorkOrder(row: Record<string, unknown>): Record<string, unknown> {
  // First, apply COLUMN_MAPPINGS to transform Excel headers to field names
  const mappedRow: Record<string, unknown> = {}
  
  Object.entries(row).forEach(([header, value]) => {
    const normalizedHeader = normalizeColumnName(header)
    const mappedField = COLUMN_MAPPINGS[header] || COLUMN_MAPPINGS[normalizedHeader]
    
    if (mappedField) {
      mappedRow[mappedField] = value
    } else {
      // Keep unmapped fields as-is (for debugging)
      mappedRow[header] = value
    }
  })
  
  // Parse quantities with units
  const productionResult = parseQuantityWithUnit(mappedRow.productionQuantity)
  const packagingResult = parseQuantityWithUnit(mappedRow.packagingQuantity)

  // Helper function to safely parse dates (including Excel serial numbers)
  const safeParseDate = (value: any): Date | null => {
    if (!value) return null
    
    // Check if it's an Excel serial number (numeric value between 1 and 100000)
    const numValue = Number(value)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100000) {
      try {
        // Method 1: Standard Excel conversion (1900 epoch)
        const excelEpoch1900 = new Date(1900, 0, 1) // January 1, 1900
        const daysSinceEpoch1900 = numValue - 2 // Adjust for Excel's leap year bug
        const resultDate1900 = new Date(excelEpoch1900.getTime() + (daysSinceEpoch1900 * 24 * 60 * 60 * 1000))
        
        // Method 2: Alternative Excel conversion (1904 epoch - used on Mac)
        const excelEpoch1904 = new Date(1904, 0, 1) // January 1, 1904
        const daysSinceEpoch1904 = numValue - 1
        const resultDate1904 = new Date(excelEpoch1904.getTime() + (daysSinceEpoch1904 * 24 * 60 * 60 * 1000))
        
        // Choose the more reasonable date (between 1900 and 2100)
        const year1900 = new Date(1900, 0, 1)
        const year2100 = new Date(2100, 0, 1)
        
        let resultDate = resultDate1900
        if (resultDate1900 < year1900 || resultDate1900 > year2100) {
          resultDate = resultDate1904
        }
        
        if (resultDate < year1900 || resultDate > year2100) {
          resultDate = new Date() // Use current date as fallback
        }
        
        // Validate the result
        if (isNaN(resultDate.getTime())) {
          resultDate = new Date()
        }
        
        return resultDate
      } catch {
        return null
      }
    }
    
    // Try regular date parsing for non-serial numbers
    try {
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    } catch {
      return null
    }
  }

  return {
    // Basic Info
    jobNumber: String(mappedRow.jobNumber || '').trim(),
    markedDate: safeParseDate(mappedRow.markedDate)?.toISOString() || null,
    customerName: String(mappedRow.customerName || '').trim(),
    personInCharge: String(mappedRow.personInCharge || '').trim(), // Keep for validation, handled separately in API
    workType: WORK_TYPE_MAPPINGS[String(mappedRow.workType || '').trim()] || WorkType.PRODUCTION,
    status: STATUS_MAPPINGS[String(mappedRow.status || '').trim()] || null,  // Default to null for ongoing work
    
    // VIP Flags - Updated to match export
    isCustomerServiceVip: String(mappedRow.isCustomerServiceVip || '').trim() === '是' || String(mappedRow.isCustomerServiceVip || '').toUpperCase() === 'TRUE',
    isBossVip: String(mappedRow.isBossVip || '').trim() === '是' || String(mappedRow.isBossVip || '').toUpperCase() === 'TRUE',
    // Legacy support
    isNewProductVip: String(mappedRow.isNewProductVip || '').trim() === '是',
    isComplexityVip: String(mappedRow.isComplexityVip || '').trim() === '是',
    
    // Material Ready Status - New
    expectedProductionMaterialsDate: safeParseDate(mappedRow.expectedProductionMaterialsDate)?.toISOString() || null,
    expectedPackagingMaterialsDate: safeParseDate(mappedRow.expectedPackagingMaterialsDate)?.toISOString() || null,
    productionMaterialsReady: String(mappedRow.productionMaterialsReady || '').trim() === '是',
    packagingMaterialsReady: String(mappedRow.packagingMaterialsReady || '').trim() === '是',
    
    // Quantities with units - PARSED from combined format
    productionQuantity: productionResult.quantity,
    productionQuantityStat: productionResult.unit,
    packagingQuantity: packagingResult.quantity,
    packagingQuantityStat: packagingResult.unit,
    
    // Delivery Dates - New
    requestedDeliveryDate: safeParseDate(mappedRow.requestedDeliveryDate)?.toISOString() || null,
    internalExpectedDate: safeParseDate(mappedRow.internalExpectedDate)?.toISOString() || null,
    
    // Status Flags - New
    isUrgent: String(mappedRow.isUrgent || '').trim() === '是',
    productionStarted: String(mappedRow.productionStarted || '').trim() === '是',
    isCompleted: String(mappedRow.isCompleted || '').trim() === '是',
    
    // Description
    workDescription: String(mappedRow.workDescription || '').trim() || '（匯入時無描述，請手動補充）',
    
    // Legacy fields (deprecated but kept for compatibility)
    yearCategory: String(mappedRow.yearCategory || '').trim() || null,
    expectedCompletionDate: safeParseDate(mappedRow.expectedCompletionDate)?.toISOString() || null,
    dataCompleteDate: safeParseDate(mappedRow.dataCompleteDate)?.toISOString() || null,
    notifiedDate: safeParseDate(mappedRow.notifiedDate)?.toISOString() || null,
    paymentReceivedDate: safeParseDate(mappedRow.paymentReceivedDate)?.toISOString() || null,
    shippedDate: safeParseDate(mappedRow.shippedDate)?.toISOString() || null,
    internalDeliveryTime: String(mappedRow.internalDeliveryTime || '').trim() || null,
    customerRequestedTime: String(mappedRow.customerRequestedTime || '').trim() || null,
    notes: String(mappedRow.notes || '').trim() || null
  }
}

