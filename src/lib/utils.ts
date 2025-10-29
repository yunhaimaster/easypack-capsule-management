import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { WeightUnit } from "@/types"
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { randomUUID } from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-TW').format(num)
}

/**
 * Format ingredient weight with smart precision
 * Removes trailing zeros but preserves necessary precision
 * Supports up to 9 decimal places for micro-ingredients
 * @param value - Weight value in mg
 * @returns Formatted string with appropriate precision
 */
export function formatIngredientWeight(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || !isFinite(num)) return '0'
  
  // Use JavaScript's default number formatting which removes trailing zeros
  // This handles both large numbers (500) and small precise numbers (0.000000025)
  return num.toString()
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return '-'
  
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return '-'

  let dateObj: Date

  if (typeof date === 'string') {
    if (date.includes('T')) {
      dateObj = new Date(date)
    } else {
      const [year, month, day] = date.split('-').map(Number)
      dateObj = new Date(year, (month ?? 1) - 1, day ?? 1)
    }
  } else {
    dateObj = date
  }

  if (isNaN(dateObj.getTime())) return '-'

  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj)
}

export function normalizeDateOnly(date: Date | string | null | undefined): string {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return ''

  const normalized = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
  normalized.setMinutes(normalized.getMinutes() - normalized.getTimezoneOffset())

  return normalized.toISOString().slice(0, 10)
}

export function convertWeight(mg: number): WeightUnit {
  if (mg >= 1000000) {
    return {
      value: mg / 1000000,
      unit: 'kg',
      display: `${(mg / 1000000).toFixed(3)} kg`
    }
  } else if (mg >= 1000) {
    return {
      value: mg / 1000,
      unit: 'g',
      display: `${(mg / 1000).toFixed(3)} g`
    }
  } else {
    return {
      value: mg,
      unit: 'mg',
      display: `${mg.toFixed(3)} mg`
    }
  }
}

export function calculateBatchWeight(unitContentMg: number, quantity: number): WeightUnit {
  const totalMg = unitContentMg * quantity
  return convertWeight(totalMg)
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return Promise.resolve()
  }
}

export function generateCSV(data: any[], headers: string[]): string {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map((_, index) => {
        const value = row[index] || ''
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
}

export function generateUUID() {
  return randomUUID()
}

export function downloadFile(source: Blob | string, filename: string, mimeType?: string) {
  const link = document.createElement('a')
  let url: string

  if (typeof source === 'string') {
    url = source
  } else {
    url = window.URL.createObjectURL(source)
  }

  link.href = url
  link.download = filename
  if (mimeType) {
    (link as HTMLAnchorElement).type = mimeType
  }
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Smart text truncation for Chinese and English text
 * - Respects word boundaries for English
 * - Handles Chinese characters properly
 * - Preserves line breaks in preview
 * - Returns { preview, fullText, isTruncated }
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length (characters, not bytes)
 * @param preserveLineBreaks - Whether to preserve first line break in preview
 * @returns Object with preview, fullText, and isTruncated flag
 */
export function truncateTextSmart(
  text: string | null,
  maxLength: number,
  preserveLineBreaks: boolean = false
): {
  preview: string
  fullText: string
  isTruncated: boolean
} {
  if (!text) {
    return {
      preview: '',
      fullText: '',
      isTruncated: false
    }
  }

  const fullText = text
  const textLength = fullText.length

  // If text is shorter than maxLength, no truncation needed
  if (textLength <= maxLength) {
    return {
      preview: fullText,
      fullText,
      isTruncated: false
    }
  }

  // Find first line break if preserveLineBreaks is true
  const firstLineBreak = preserveLineBreaks ? fullText.indexOf('\n') : -1
  const firstLineBreakWithinLimit = firstLineBreak >= 0 && firstLineBreak < maxLength

  // Calculate truncation point
  let truncateAt = maxLength

  // Try to break at word boundary for English text (after space or punctuation)
  if (truncateAt < textLength) {
    // Look backwards from truncateAt for a word boundary
    const beforeTruncate = fullText.substring(0, truncateAt)
    const lastSpaceIndex = beforeTruncate.lastIndexOf(' ')
    const lastPunctuationIndex = Math.max(
      beforeTruncate.lastIndexOf('。'),
      beforeTruncate.lastIndexOf('，'),
      beforeTruncate.lastIndexOf('、'),
      beforeTruncate.lastIndexOf('.'), 
      beforeTruncate.lastIndexOf(','),
      beforeTruncate.lastIndexOf(';')
    )
    
    // Prefer breaking at punctuation, then space, but not too far back
    const boundaryIndex = Math.max(lastPunctuationIndex, lastSpaceIndex)
    if (boundaryIndex > maxLength * 0.7) { // Don't break too far back
      truncateAt = boundaryIndex + 1
    }
  }

  // If we have a line break within limit and preserveLineBreaks, include it
  let preview = fullText.substring(0, truncateAt)
  
  if (firstLineBreakWithinLimit && preserveLineBreaks) {
    // Keep the line break and truncate after it
    preview = fullText.substring(0, Math.min(firstLineBreak + 1, truncateAt))
  }

  // Add ellipsis
  preview = preview.trim() + '...'

  return {
    preview,
    fullText,
    isTruncated: true
  }
}
