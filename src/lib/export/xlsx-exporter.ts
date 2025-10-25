/**
 * XLSX Exporter for Work Orders
 * 
 * Exports work orders to Excel format with proper Chinese character encoding.
 * Uses SheetJS (xlsx) library with cpexcel for Chinese support.
 */

import { WorkOrder } from '@/types/work-order'
import * as XLSX from 'xlsx'
import { prepareChineseForExcel } from './encoding-utils'

/**
 * Column definitions for work order export
 * Maps internal field names to Chinese headers
 */
export const WORK_ORDER_COLUMNS = {
  // Basic Info
  jobNumber: '訂單編號',
  markedDate: '創建日期',
  customerName: '客戶名稱',
  personInCharge: '負責人',
  workType: '工作類型',
  status: '狀態',
  
  // VIP Flags (Updated)
  isCustomerServiceVip: '客服VIP',
  isBossVip: '老闆VIP',
  
  // Material Ready Status (New)
  expectedProductionMaterialsDate: '預計生產物料到齊日期',
  expectedPackagingMaterialsDate: '預計包裝物料到齊日期',
  productionMaterialsReady: '生產物料齊',
  packagingMaterialsReady: '包裝物料齊',
  
  // Quantities
  productionQuantity: '生產數量',
  packagingQuantity: '包裝數量',
  
  // Delivery Dates (New)
  requestedDeliveryDate: '要求交貨日期',
  internalExpectedDate: '內部預計交貨期',
  
  // Status Flags (New)
  isUrgent: '客人要求加急',
  productionStarted: '已開生產線',
  isCompleted: '已經完成',
  
  // Description
  workDescription: '工作描述',
  
  // Capsulation Order (if exists)
  productName: '產品名稱',
  capsuleColor: '膠囊顏色',
  capsuleSize: '膠囊尺寸',
  capsuleType: '膠囊類型',
  customerService: '客服',
  
  // Metadata
  createdAt: '建立時間',
  updatedAt: '更新時間'
} as const

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
 * Format date for Excel display
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
 * Convert work order data to Excel row
 */
function workOrderToRow(
  workOrder: WorkOrder,
  selectedColumns: string[]
): Record<string, string | number | boolean> {
  const row: Record<string, string | number | boolean> = {}
  
  const columnMap: Record<string, () => string | number | boolean> = {
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
    productionQuantity: () => workOrder.productionQuantity || '',
    packagingQuantity: () => workOrder.packagingQuantity || '',
    
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
    row[header] = value
  })
  
  return row
}

/**
 * Export work orders to XLSX format
 * 
 * @param workOrders - Array of work orders to export
 * @param selectedColumns - Which columns to include (defaults to all)
 * @returns Buffer containing XLSX file
 */
export function exportWorkOrdersToXLSX(
  workOrders: WorkOrder[],
  selectedColumns?: string[]
): Buffer {
  // Default to all columns if not specified
  const columns = selectedColumns || Object.keys(WORK_ORDER_COLUMNS)
  
  // Convert work orders to rows
  const rows = workOrders.map(wo => workOrderToRow(wo, columns))
  
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
    const header = WORK_ORDER_COLUMNS[col as keyof typeof WORK_ORDER_COLUMNS]
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
  XLSX.utils.book_append_sheet(workbook, worksheet, '工作單')
  
  // Write to buffer with proper encoding
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true
  })
  
  return buffer
}

/**
 * Get default filename for export
 */
export function getExportFilename(format: 'xlsx' | 'csv' = 'xlsx'): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `工作單匯出_${timestamp}.${format}`
}

