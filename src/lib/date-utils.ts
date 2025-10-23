/**
 * 格式化日期為香港格式 (YYYY/MM/DD)
 * @param date - Date 對象、日期字符串或 null/undefined
 * @returns 格式化後的日期字符串，無效日期返回 '-'
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return '-'
  }
}

/**
 * 格式化日期時間為香港格式 (YYYY/MM/DD HH:mm)
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch {
    return '-'
  }
}

