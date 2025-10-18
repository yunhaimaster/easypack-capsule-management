/**
 * Granulation Export Utilities
 * 用於將訂單配方/配方庫匯出至製粒分析頁面
 */

import { ProductionOrder } from '@/types'

interface GranulationIngredient {
  materialName: string
  unitContentMg: number
  isCustomerProvided: boolean
}

interface RecipeIngredient {
  materialName: string
  unitContentMg: number
}

const STORAGE_KEY = 'granulation-import-data'

/**
 * 將訂單配方匯出至製粒分析頁面
 * @param order 生產訂單
 */
export function exportOrderToGranulation(order: ProductionOrder): void {
  if (!order.ingredients || order.ingredients.length === 0) {
    throw new Error('該訂單沒有配方原料')
  }

  // 轉換原料格式
  const ingredients: GranulationIngredient[] = order.ingredients.map((ing) => ({
    materialName: ing.materialName,
    unitContentMg: ing.unitContentMg,
    isCustomerProvided: ing.isCustomerProvided
  }))

  let url = `/granulation-analyzer?source=order&orderId=${order.id}`

  try {
    // 使用 sessionStorage 儲存配方資料
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients))
    }
  } catch (error) {
    console.error('無法儲存至 sessionStorage:', error)
    // 如果 sessionStorage 不可用，使用 URL query params 作為後備
    const encodedData = encodeURIComponent(JSON.stringify(ingredients))
    url = `/granulation-analyzer?source=order&orderId=${order.id}&data=${encodedData}`
  }

  // 執行導航
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

/**
 * 從 sessionStorage 或 URL 讀取製粒分析配方資料
 * @returns 原料陣列或 null
 */
export function getGranulationImportData(): GranulationIngredient[] | null {
  try {
    // 優先從 sessionStorage 讀取
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        // 讀取後立即清除
        sessionStorage.removeItem(STORAGE_KEY)
        const parsed = JSON.parse(stored)
        
        // 驗證資料格式
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isValid = parsed.every(
            (item) =>
              typeof item.materialName === 'string' &&
              typeof item.unitContentMg === 'number' &&
              typeof item.isCustomerProvided === 'boolean'
          )
          
          if (isValid) {
            return parsed as GranulationIngredient[]
          }
        }
      }
    }

    // 後備方案：從 URL query params 讀取
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const dataParam = params.get('data')
      
      if (dataParam) {
        const decoded = decodeURIComponent(dataParam)
        const parsed = JSON.parse(decoded)
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as GranulationIngredient[]
        }
      }
    }
  } catch (error) {
    console.error('解析製粒配方資料時發生錯誤:', error)
  }

  return null
}

/**
 * 驗證訂單是否有有效的配方原料
 * @param order 生產訂單
 * @returns 是否有有效原料
 */
export function hasValidIngredients(order: ProductionOrder): boolean {
  return Boolean(
    order.ingredients &&
    Array.isArray(order.ingredients) &&
    order.ingredients.length > 0 &&
    order.ingredients.some((ing) => ing.materialName && ing.unitContentMg > 0)
  )
}

/**
 * 驗證訂單是否可以匯出至製粒分析
 * @param order 生產訂單
 * @returns 驗證結果
 */
export function validateOrderForGranulation(order: ProductionOrder): {
  valid: boolean
  message?: string
} {
  if (!order.ingredients || order.ingredients.length === 0) {
    return {
      valid: false,
      message: '此訂單沒有原料配方，無法進行製粒分析'
    }
  }

  const validIngredients = order.ingredients.filter(
    (ing) => ing.materialName && ing.materialName.trim() !== '' && ing.unitContentMg > 0
  )

  if (validIngredients.length === 0) {
    return {
      valid: false,
      message: '此訂單的原料配方資料不完整，無法進行製粒分析'
    }
  }

  return { valid: true }
}

/**
 * 將配方庫配方匯出至製粒分析頁面
 * @param ingredients 配方原料陣列
 */
export function exportRecipeToGranulation(ingredients: RecipeIngredient[]): void {
  if (!ingredients || ingredients.length === 0) {
    throw new Error('配方沒有原料')
  }

  // 轉換原料格式（配方庫沒有 isCustomerProvided 字段）
  const granulationIngredients: GranulationIngredient[] = ingredients.map((ing) => ({
    materialName: ing.materialName,
    unitContentMg: ing.unitContentMg,
    isCustomerProvided: false // 配方庫默認為 false
  }))

  try {
    // 使用 sessionStorage 儲存配方資料
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(granulationIngredients))
    }
  } catch (error) {
    console.error('無法儲存至 sessionStorage:', error)
  }

  // 執行導航
  if (typeof window !== 'undefined') {
    window.location.href = '/granulation-analyzer?source=recipe'
  }
}
