/**
 * CSV Exporter for Work Orders
 * 
 * Exports work orders to CSV format with UTF-8 BOM for proper Chinese character encoding.
 * Uses PapaParse for reliable CSV generation.
 */

import Papa from 'papaparse'
import { WorkOrder } from '@/types/work-order'
import { addUTF8BOM, prepareChineseForExcel } from './encoding-utils'
import { WORK_ORDER_COLUMNS } from './xlsx-exporter'

/**
 * Map work type enum to Chinese display name
 */
const WORK_TYPE_NAMES: Record<string, string> = {
  PACKAGING: '包裝',
  PRODUCTION: '生產',
  PRODUCTION_PACKAGING: '生產+包裝',
  WAREHOUSING: '倉務'
}

/**
 * Map status enum to Chinese display name
 */
const STATUS_NAMES: Record<string, string> = {
  DRAFT: '草稿',
  PENDING: '待處理',
  DATA_COMPLETE: '資料齊全',
  NOTIFIED: '已通知',
  PAID: '已收數',
  SHIPPED: '已出貨',
  COMPLETED: '已完成',
  ON_HOLD: '暫停',
  CANCELLED: '已取消'
}

/**
 * Format date for CSV display
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Convert work order to CSV row object
 */
function workOrderToRow(
  workOrder: WorkOrder,
  selectedColumns: string[]
): Record<string, string> {
  const row: Record<string, string> = {}
  
  const columnMap: Record<string, () => string> = {
    jobNumber: () => workOrder.jobNumber || '',
    markedDate: () => formatDate(workOrder.markedDate),
    customerName: () => workOrder.customerName,
    personInCharge: () => workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '',
    workType: () => WORK_TYPE_NAMES[workOrder.workType] || workOrder.workType,
    status: () => STATUS_NAMES[workOrder.status] || workOrder.status,
    
    // New VIP flags
    isCustomerServiceVip: () => workOrder.isCustomerServiceVip ? '是' : '否',
    isBossVip: () => workOrder.isBossVip ? '是' : '否',
    
    // New material ready status
    expectedProductionMaterialsDate: () => formatDate(workOrder.expectedProductionMaterialsDate),
    expectedPackagingMaterialsDate: () => formatDate(workOrder.expectedPackagingMaterialsDate),
    productionMaterialsReady: () => workOrder.productionMaterialsReady ? '是' : '否',
    packagingMaterialsReady: () => workOrder.packagingMaterialsReady ? '是' : '否',
    
    // Quantities
    productionQuantity: () => workOrder.productionQuantity?.toString() || '',
    packagingQuantity: () => workOrder.packagingQuantity?.toString() || '',
    
    // New delivery dates
    requestedDeliveryDate: () => formatDate(workOrder.requestedDeliveryDate),
    internalExpectedDate: () => formatDate(workOrder.internalExpectedDate),
    
    // New status flags
    isUrgent: () => workOrder.isUrgent ? '是' : '否',
    productionStarted: () => workOrder.productionStarted ? '是' : '否',
    isCompleted: () => workOrder.isCompleted ? '是' : '否',
    
    // Description
    workDescription: () => workOrder.workDescription,
    
    // Capsulation order fields
    productName: () => workOrder.capsulationOrder?.productName || '',
    capsuleColor: () => workOrder.capsulationOrder?.capsuleColor || '',
    capsuleSize: () => workOrder.capsulationOrder?.capsuleSize || '',
    capsuleType: () => workOrder.capsulationOrder?.capsuleType || '',
    customerService: () => workOrder.capsulationOrder?.customerService?.nickname || workOrder.capsulationOrder?.customerService?.phoneE164 || '',
    
    // Metadata
    createdAt: () => formatDate(workOrder.createdAt),
    updatedAt: () => formatDate(workOrder.updatedAt)
  }
  
  selectedColumns.forEach(col => {
    const header = WORK_ORDER_COLUMNS[col as keyof typeof WORK_ORDER_COLUMNS]
    const value = columnMap[col]?.() ?? ''
    // Prepare for Chinese encoding
    row[header] = prepareChineseForExcel(value)
  })
  
  return row
}

/**
 * Export work orders to CSV format
 * 
 * @param workOrders - Array of work orders to export
 * @param selectedColumns - Which columns to include (defaults to all)
 * @returns String containing CSV data with UTF-8 BOM
 */
export function exportWorkOrdersToCSV(
  workOrders: WorkOrder[],
  selectedColumns?: string[]
): string {
  // Default to all columns if not specified
  const columns = selectedColumns || Object.keys(WORK_ORDER_COLUMNS)
  
  // Convert work orders to rows
  const rows = workOrders.map(wo => workOrderToRow(wo, columns))
  
  // Get headers in order
  const headers = columns.map(col => WORK_ORDER_COLUMNS[col as keyof typeof WORK_ORDER_COLUMNS])
  
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
 * Get default filename for CSV export
 */
export function getCSVExportFilename(): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `工作單匯出_${timestamp}.csv`
}

