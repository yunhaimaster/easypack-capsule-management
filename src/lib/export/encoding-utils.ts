/**
 * Encoding utilities for Chinese-safe CSV/Excel exports
 * 
 * Critical for Easy Health work order system:
 * - CSV exports need UTF-8 BOM for Excel to recognize Chinese characters
 * - XLSX handles Chinese natively with SheetJS + cpexcel
 */

/**
 * Add UTF-8 BOM (Byte Order Mark) to string
 * 
 * Required for Excel to correctly display Chinese characters in CSV files.
 * Without BOM: 中文 displays as gibberish (ä¸­æ–‡)
 * With BOM: 中文 displays correctly
 * 
 * @param str - The string to add BOM to
 * @returns String with UTF-8 BOM prepended
 */
export function addUTF8BOM(str: string): string {
  const BOM = '\uFEFF'
  return BOM + str
}

/**
 * Test if string contains Chinese characters
 * 
 * @param str - String to test
 * @returns True if contains Chinese characters
 */
export function hasChineseCharacters(str: string): boolean {
  // Unicode range for Chinese characters (CJK Unified Ideographs)
  return /[\u4e00-\u9fa5]/.test(str)
}

/**
 * Prepare Chinese text for Excel-safe encoding
 * 
 * Ensures proper UTF-8 encoding for Chinese characters.
 * Excel expects UTF-8 encoded bytes for Chinese text.
 * 
 * @param text - Text to prepare
 * @returns UTF-8 encoded text
 */
export function prepareChineseForExcel(text: string): string {
  // Ensure UTF-8 encoding
  const encoder = new TextEncoder()
  const decoder = new TextDecoder('utf-8')
  const bytes = encoder.encode(text)
  return decoder.decode(bytes)
}

/**
 * Normalize column name for fuzzy matching
 * 
 * Used for auto-mapping spreadsheet columns to database fields.
 * Removes spaces, line breaks, converts to lowercase, handles Chinese and English.
 * 
 * @param name - Column name to normalize
 * @returns Normalized name
 */
export function normalizeColumnName(name: string): string {
  return name
    .trim()
    .replace(/[\r\n]+/g, '')  // Remove line breaks (from multi-line Excel headers)
    .toLowerCase()
    .replace(/[\s_-]+/g, '')  // Remove spaces, underscores, hyphens
}

/**
 * Calculate Levenshtein distance for fuzzy string matching
 * 
 * Used for fuzzy matching of user names and column names during import.
 * Returns similarity score between 0 and 1.
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-1, where 1 is exact match)
 */
export function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) {
    return 1.0
  }
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Normalize person name for matching
 * 
 * Used for matching spreadsheet person names to database users.
 * Handles Chinese and English names.
 * 
 * @param name - Name to normalize
 * @returns Normalized name
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')  // Remove all spaces
}

/**
 * Create a Blob with proper encoding for CSV download
 * 
 * @param content - CSV content string
 * @param withBOM - Whether to add UTF-8 BOM (default: true for Excel compatibility)
 * @returns Blob ready for download
 */
export function createCSVBlob(content: string, withBOM: boolean = true): Blob {
  const finalContent = withBOM ? addUTF8BOM(content) : content
  return new Blob([finalContent], { type: 'text/csv;charset=utf-8;' })
}

/**
 * Trigger browser download of a Blob
 * 
 * @param blob - Blob to download
 * @param filename - Suggested filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

