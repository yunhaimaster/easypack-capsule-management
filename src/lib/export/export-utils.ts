/**
 * Standardized Export Utilities for Chinese Character Support
 * 
 * This module provides standardized utilities to ensure ALL export functions
 * in the Easy Health system properly handle Chinese characters.
 * 
 * CRITICAL: All export functions MUST use these utilities to ensure
 * consistent Chinese character handling across the application.
 */

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { addUTF8BOM, prepareChineseForExcel, createCSVBlob } from './encoding-utils'

/**
 * Standard CSV Export Configuration
 * 
 * Ensures proper Chinese character handling for all CSV exports.
 * Use this configuration for ALL CSV generation.
 */
export const STANDARD_CSV_CONFIG: Papa.UnparseConfig = {
  header: true,
  quotes: true, // Quote all fields for safety
  quoteChar: '"',
  escapeChar: '"',
  delimiter: ',',
  newline: '\r\n' // Windows-style line endings for better Excel compatibility
}

/**
 * Standard XLSX Export Configuration
 * 
 * Ensures proper Chinese character handling for all XLSX exports.
 * Use this configuration for ALL XLSX generation.
 */
export const STANDARD_XLSX_CONFIG: XLSX.WritingOptions = {
  type: 'buffer',
  bookType: 'xlsx',
  compression: true
}

/**
 * Export CSV with proper Chinese character support
 * 
 * This is the STANDARD function for all CSV exports.
 * It automatically handles UTF-8 BOM and proper escaping.
 * 
 * @param data - Array of objects to export
 * @param filename - Suggested filename (without extension)
 * @returns NextResponse with proper headers for CSV download
 */
export function exportToCSV(
  data: Record<string, any>[],
  filename: string
): { content: string; headers: Record<string, string> } {
  // Generate CSV using PapaParse with standard config
  const csv = Papa.unparse(data, STANDARD_CSV_CONFIG)
  
  // Add UTF-8 BOM for proper Chinese display in Excel
  const csvContent = addUTF8BOM(csv)
  
  return {
    content: csvContent,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`
    }
  }
}

/**
 * Export XLSX with proper Chinese character support
 * 
 * This is the STANDARD function for all XLSX exports.
 * It automatically handles Chinese character encoding.
 * 
 * @param data - Array of objects to export
 * @param filename - Suggested filename (without extension)
 * @param sheetName - Name of the worksheet (default: '數據')
 * @returns Buffer containing XLSX file
 */
export function exportToXLSX(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = '數據'
): Buffer {
  // Prepare data for Chinese encoding
  const preparedData = data.map(row => {
    const preparedRow: Record<string, any> = {}
    Object.entries(row).forEach(([key, value]) => {
      preparedRow[key] = typeof value === 'string' 
        ? prepareChineseForExcel(value) 
        : value
    })
    return preparedRow
  })
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(preparedData)
  
  // Set column widths based on content
  const columnWidths = Object.keys(data[0] || {}).map(key => {
    const maxLength = Math.max(
      key.length,
      ...preparedData.map(row => String(row[key] || '').length)
    )
    return { wch: Math.min(maxLength + 2, 50) } // Max 50 chars width
  })
  
  worksheet['!cols'] = columnWidths
  
  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Write to buffer with proper encoding
  return XLSX.write(workbook, STANDARD_XLSX_CONFIG)
}

/**
 * Export HTML with proper Chinese character support
 * 
 * For HTML exports (like recipe PDFs), ensures proper UTF-8 encoding.
 * 
 * @param html - HTML content
 * @param filename - Suggested filename (without extension)
 * @returns NextResponse with proper headers for HTML download
 */
export function exportToHTML(
  html: string,
  filename: string
): { content: string; headers: Record<string, string> } {
  return {
    content: html,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.html"`
    }
  }
}

/**
 * Standard response headers for Chinese-safe exports
 * 
 * Use these headers for ALL export responses to ensure proper
 * Chinese character display in browsers and Excel.
 */
export const STANDARD_EXPORT_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

/**
 * Validate export data for Chinese character safety
 * 
 * Checks if data contains Chinese characters and warns if not properly handled.
 * 
 * @param data - Data to validate
 * @returns Validation result with warnings
 */
export function validateChineseData(data: Record<string, any>[]): {
  hasChinese: boolean;
  warnings: string[];
} {
  const warnings: string[] = []
  let hasChinese = false
  
  data.forEach((row, index) => {
    Object.entries(row).forEach(([key, value]) => {
      if (typeof value === 'string' && /[\u4e00-\u9fa5]/.test(value)) {
        hasChinese = true
        if (!value.trim()) {
          warnings.push(`Row ${index + 1}, field "${key}": Chinese text is empty or whitespace only`)
        }
      }
    })
  })
  
  if (hasChinese && warnings.length === 0) {
    warnings.push('Data contains Chinese characters - ensure UTF-8 BOM is used for CSV exports')
  }
  
  return { hasChinese, warnings }
}

/**
 * Create standardized filename with timestamp
 * 
 * @param prefix - Filename prefix
 * @param format - File format (csv, xlsx, html, pdf)
 * @returns Standardized filename
 */
export function createExportFilename(prefix: string, format: string): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${prefix}-${timestamp}.${format}`
}

/**
 * Export format validation
 * 
 * Validates that the requested export format is supported.
 * 
 * @param format - Requested format
 * @returns True if format is supported
 */
export function isValidExportFormat(format: string): boolean {
  const supportedFormats = ['csv', 'xlsx', 'html', 'pdf', 'svg']
  return supportedFormats.includes(format.toLowerCase())
}

/**
 * Get MIME type for export format
 * 
 * @param format - Export format
 * @returns MIME type string
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    csv: 'text/csv; charset=utf-8',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    html: 'text/html; charset=utf-8',
    pdf: 'application/pdf',
    svg: 'image/svg+xml'
  }
  
  return mimeTypes[format.toLowerCase()] || 'application/octet-stream'
}
