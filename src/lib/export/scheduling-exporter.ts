/**
 * Scheduling Table Exporter
 * 
 * Exports manager scheduling entries to XLSX/CSV format with proper Chinese character encoding.
 */

import { ManagerSchedulingEntry } from '@/types/manager-scheduling'
import { WorkType } from '@prisma/client'
import * as XLSX from 'xlsx'
import { prepareChineseForExcel } from './encoding-utils'
import Papa from 'papaparse'
import { addUTF8BOM } from './encoding-utils'

/**
 * Column definitions for scheduling table export
 * Maps internal field names to Chinese headers (12 columns total)
 */
export const SCHEDULING_COLUMNS = {
  // Column 1: Priority order
  priority: '次序',
  
  // Column 2: Process issues (from CapsulationOrder)
  processIssues: '製程問題',
  
  // Column 3: Quality notes (from CapsulationOrder)
  qualityNotes: '品質備註',
  
  // Column 4: Created date (from UnifiedWorkOrder)
  createdAt: '創建日期',
  
  // Column 5: Customer name (from UnifiedWorkOrder)
  customerName: '客戶名稱',
  
  // Column 6: Person in charge (from UnifiedWorkOrder)
  personInCharge: '負責人',
  
  // Column 7: Work type (from UnifiedWorkOrder)
  workType: '工作類型',
  
  // Column 8: Expected production materials date (from UnifiedWorkOrder)
  expectedProductionMaterialsDate: '預計生產物料到齊日期',
  
  // Column 9: Production materials ready (from UnifiedWorkOrder)
  productionMaterialsReady: '生產物料已齊',
  
  // Column 10: Estimated production start date (scheduling-specific)
  expectedProductionStartDate: '預計開產日期',
  
  // Column 11: Work description (from UnifiedWorkOrder)
  workDescription: '工作描述',
  
  // Column 12: Production quantity (from UnifiedWorkOrder)
  productionQuantity: '生產數量'
} as const

/**
 * Map work type enum to Chinese display name
 */
const WORK_TYPE_NAMES: Record<WorkType, string> = {
  PACKAGING: '包裝',
  PRODUCTION: '生產',
  PRODUCTION_PACKAGING: '生產+包裝',
  WAREHOUSING: '倉務'
}

/**
 * Format date for display
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Convert scheduling entry to Excel row
 */
function schedulingEntryToRow(
  entry: ManagerSchedulingEntry,
  selectedColumns: string[]
): Record<string, string | number | boolean> {
  const row: Record<string, string | number | boolean> = {}
  
  const columnMap: Record<string, () => string | number | boolean> = {
    priority: () => entry.priority,
    processIssues: () => entry.processIssues || '',
    qualityNotes: () => entry.qualityNotes || '',
    createdAt: () => formatDate(entry.workOrder.createdAt),
    customerName: () => entry.workOrder.customerName,
    personInCharge: () => entry.workOrder.personInCharge?.nickname || entry.workOrder.personInCharge?.phoneE164 || '',
    workType: () => WORK_TYPE_NAMES[entry.workOrder.workType] || entry.workOrder.workType,
    expectedProductionMaterialsDate: () => formatDate(entry.workOrder.expectedProductionMaterialsDate),
    productionMaterialsReady: () => entry.workOrder.productionMaterialsReady ? '是' : '否',
    expectedProductionStartDate: () => entry.expectedProductionStartDate || '',
    workDescription: () => entry.workOrder.workDescription,
    productionQuantity: () => entry.workOrder.productionQuantity || ''
  }
  
  // Map selected columns to row values
  selectedColumns.forEach(col => {
    const header = SCHEDULING_COLUMNS[col as keyof typeof SCHEDULING_COLUMNS]
    const valueFn = columnMap[col]
    
    if (header && valueFn) {
      row[header] = valueFn()
    }
  })
  
  return row
}

/**
 * Export scheduling entries to XLSX format
 * 
 * @param entries - Array of scheduling entries to export
 * @param selectedColumns - Which columns to include (defaults to all)
 * @returns Buffer containing XLSX file
 */
export function exportSchedulingToXLSX(
  entries: ManagerSchedulingEntry[],
  selectedColumns?: string[]
): Buffer {
  // Default to all columns if not specified
  const columns = selectedColumns || Object.keys(SCHEDULING_COLUMNS)
  
  // Convert entries to rows
  const rows = entries.map(entry => schedulingEntryToRow(entry, columns))
  
  // Prepare data for Chinese encoding
  const preparedRows = rows.map(row => {
    const preparedRow: Record<string, string | number | boolean> = {}
    Object.entries(row).forEach(([key, value]) => {
      preparedRow[key] = typeof value === 'string' ? prepareChineseForExcel(value) : value
    })
    return preparedRow
  })
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(preparedRows)
  
  // Set column widths based on content
  const columnWidths = columns.map(col => {
    const header = SCHEDULING_COLUMNS[col as keyof typeof SCHEDULING_COLUMNS]
    const maxLength = Math.max(
      header.length,
      ...preparedRows.map(row => {
        const value = row[header]
        return String(value || '').length
      })
    )
    return { wch: Math.min(maxLength + 2, 50) } // Max 50 chars width
  })
  
  worksheet['!cols'] = columnWidths
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '排單表')
  
  // Write to buffer with proper encoding
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true
  })
  
  return buffer
}

/**
 * Convert scheduling entry to CSV row object
 */
function schedulingEntryToCSVRow(
  entry: ManagerSchedulingEntry,
  selectedColumns: string[]
): Record<string, string> {
  const row: Record<string, string> = {}
  
  const columnMap: Record<string, () => string> = {
    priority: () => entry.priority.toString(),
    processIssues: () => entry.processIssues || '',
    qualityNotes: () => entry.qualityNotes || '',
    createdAt: () => formatDate(entry.workOrder.createdAt),
    customerName: () => entry.workOrder.customerName,
    personInCharge: () => entry.workOrder.personInCharge?.nickname || entry.workOrder.personInCharge?.phoneE164 || '',
    workType: () => WORK_TYPE_NAMES[entry.workOrder.workType] || entry.workOrder.workType,
    expectedProductionMaterialsDate: () => formatDate(entry.workOrder.expectedProductionMaterialsDate),
    productionMaterialsReady: () => entry.workOrder.productionMaterialsReady ? '是' : '否',
    expectedProductionStartDate: () => entry.expectedProductionStartDate || '',
    workDescription: () => entry.workOrder.workDescription,
    productionQuantity: () => entry.workOrder.productionQuantity?.toString() || ''
  }
  
  // Map selected columns to row values
  selectedColumns.forEach(col => {
    const header = SCHEDULING_COLUMNS[col as keyof typeof SCHEDULING_COLUMNS]
    const valueFn = columnMap[col]
    
    if (header && valueFn) {
      row[header] = valueFn()
    }
  })
  
  return row
}

/**
 * Export scheduling entries to CSV format
 * 
 * @param entries - Array of scheduling entries to export
 * @param selectedColumns - Which columns to include (defaults to all)
 * @returns String containing CSV data with UTF-8 BOM
 */
export function exportSchedulingToCSV(
  entries: ManagerSchedulingEntry[],
  selectedColumns?: string[]
): string {
  // Default to all columns if not specified
  const columns = selectedColumns || Object.keys(SCHEDULING_COLUMNS)
  
  // Convert entries to rows
  const rows = entries.map(entry => schedulingEntryToCSVRow(entry, columns))
  
  // Get headers in order
  const headers = columns.map(col => SCHEDULING_COLUMNS[col as keyof typeof SCHEDULING_COLUMNS])
  
  // Generate CSV using PapaParse
  const csv = Papa.unparse({
    fields: headers,
    data: rows
  }, {
    header: true,
    quotes: true, // Quote all fields for safety
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ',',
    newline: '\r\n' // Windows-style line endings for better Excel compatibility
  })
  
  // Add UTF-8 BOM for proper Chinese display in Excel
  return addUTF8BOM(csv)
}

/**
 * Get default filename for export
 */
export function getSchedulingExportFilename(format: 'xlsx' | 'csv' = 'xlsx'): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `排單表_${timestamp}.${format}`
}

