import { createHash } from 'crypto'
import type { Ingredient } from '@/types'

/**
 * 配方指紋生成器
 * 
 * 用途：為配方生成唯一標識，用於去重判斷
 * 邏輯：相同客戶 + 相同產品 + 相同原料組合 = 相同配方
 * 
 * 使用 SHA-256 hash 確保：
 * 1. 相同配方總是生成相同指紋
 * 2. 不同配方生成不同指紋
 * 3. 指紋長度固定，適合作為資料庫索引
 */
export function generateRecipeFingerprint(
  customerName: string,
  productName: string,
  ingredients: Ingredient[] | { materialName: string; unitContentMg: number }[]
): string {
  // 1. 標準化客戶和產品名稱（去空格、轉小寫）
  const normalizedCustomer = customerName.trim().toLowerCase()
  const normalizedProduct = productName.trim().toLowerCase()
  
  // 2. 原料排序並格式化（確保相同原料組合產生相同指紋）
  // 注意：只考慮原料名稱和含量，不考慮 isCustomerProvided 等標誌
  const sortedIngredients = [...ingredients]
    .sort((a, b) => a.materialName.localeCompare(b.materialName))
    .map(ing => `${ing.materialName.trim().toLowerCase()}:${ing.unitContentMg}`)
    .join('|')
  
  // 3. 組合成原始字串
  const rawString = `${normalizedCustomer}::${normalizedProduct}::${sortedIngredients}`
  
  // 4. 生成 SHA-256 hash
  return createHash('sha256').update(rawString, 'utf8').digest('hex')
}

/**
 * 比較兩個配方是否相同
 * 
 * @param recipe1 第一個配方
 * @param recipe2 第二個配方
 * @returns 是否為相同配方
 */
export function areRecipesSame(
  recipe1: {
    customerName: string
    productName: string
    ingredients: Ingredient[] | { materialName: string; unitContentMg: number }[]
  },
  recipe2: {
    customerName: string
    productName: string
    ingredients: Ingredient[] | { materialName: string; unitContentMg: number }[]
  }
): boolean {
  const fingerprint1 = generateRecipeFingerprint(
    recipe1.customerName,
    recipe1.productName,
    recipe1.ingredients
  )
  
  const fingerprint2 = generateRecipeFingerprint(
    recipe2.customerName,
    recipe2.productName,
    recipe2.ingredients
  )
  
  return fingerprint1 === fingerprint2
}

/**
 * 驗證配方指紋格式
 * 
 * @param fingerprint 指紋字串
 * @returns 是否為有效的 SHA-256 hash
 */
export function isValidRecipeFingerprint(fingerprint: string): boolean {
  // SHA-256 hash 是 64 個字符的十六進制字串
  return /^[a-f0-9]{64}$/.test(fingerprint)
}

