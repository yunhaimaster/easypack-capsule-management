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
  jobNumber: 'JOB標號',
  markedDate: '標記日期',
  customerName: '客戶名稱',
  personInCharge: '負責人',
  workType: '工作類型',
  status: '狀態',
  
  // VIP Flags
  isNewProductVip: '新品VIP',
  isComplexityVip: '複雜度VIP',
  yearCategory: '年份類別',
  
  // Dates
  expectedCompletionDate: '預計完成日期',
  dataCompleteDate: '資料齊全日期',
  notifiedDate: '通知日期',
  paymentReceivedDate: '收數日期',
  shippedDate: '出貨日期',
  
  // Quantities
  productionQuantity: '生產數量',
  packagingQuantity: '包裝數量',
  
  // Time
  internalDeliveryTime: '內部交貨時間',
  customerRequestedTime: '客戶要求時間',
  
  // Description
  workDescription: '工作描述',
  notes: '備註',
  
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
    jobNumber: () => workOrder.jobNumber,
    markedDate: () => formatDate(workOrder.markedDate),
    customerName: () => workOrder.customerName,
    personInCharge: () => workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '',
    workType: () => WORK_TYPE_NAMES[workOrder.workType] || workOrder.workType,
    status: () => STATUS_NAMES[workOrder.status] || workOrder.status,
    isNewProductVip: () => workOrder.isNewProductVip ? '是' : '否',
    isComplexityVip: () => workOrder.isComplexityVip ? '是' : '否',
    yearCategory: () => workOrder.yearCategory || '',
    expectedCompletionDate: () => formatDate(workOrder.expectedCompletionDate),
    dataCompleteDate: () => formatDate(workOrder.dataCompleteDate),
    notifiedDate: () => formatDate(workOrder.notifiedDate),
    paymentReceivedDate: () => formatDate(workOrder.paymentReceivedDate),
    shippedDate: () => formatDate(workOrder.shippedDate),
    productionQuantity: () => workOrder.productionQuantity || '',
    packagingQuantity: () => workOrder.packagingQuantity || '',
    internalDeliveryTime: () => workOrder.internalDeliveryTime || '',
    customerRequestedTime: () => workOrder.customerRequestedTime || '',
    workDescription: () => workOrder.workDescription,
    notes: () => workOrder.notes || '',
    productName: () => workOrder.capsulationOrder?.productName || '',
    capsuleColor: () => workOrder.capsulationOrder?.capsuleColor || '',
    capsuleSize: () => workOrder.capsulationOrder?.capsuleSize || '',
    capsuleType: () => workOrder.capsulationOrder?.capsuleType || '',
    customerService: () => workOrder.capsulationOrder?.customerService?.nickname || workOrder.capsulationOrder?.customerService?.phoneE164 || '',
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

