import { WorkType, ProductionOrderStatus } from '@prisma/client'

export interface ProductionOrder {
  id: string
  customerName: string
  productName: string
  productionQuantity: number
  unitWeightMg: number
  batchTotalWeightMg: number
  completionDate?: Date | null
  processIssues?: string | null
  qualityNotes?: string | null
  capsuleColor?: string | null
  capsuleSize?: string | null
  capsuleType?: string | null
  createdAt: Date
  updatedAt: Date
  customerService?: string | null
  actualProductionQuantity?: number | null
  materialYieldQuantity?: number | null
  lockPassword?: string | null
  status?: ProductionOrderStatus | null
  statusUpdatedAt?: Date | null
  ingredients: Ingredient[]
  worklogs?: OrderWorklog[]
  totalWorkUnits?: number
  
  // NEW: Linked work order
  workOrderId?: string | null
  workOrder?: {
    id: string
    jobNumber?: string | null
    customerName: string
    workType: WorkType
  } | null
}

export interface Ingredient {
  id: string
  orderId: string
  materialName: string
  unitContentMg: number
  isCustomerProvided: boolean
  isCustomerSupplied: boolean
}

export interface CreateProductionOrderData {
  customerName: string
  productName: string
  productionQuantity: number
  completionDate?: Date | null
  processIssues?: string | null
  qualityNotes?: string | null
  capsuleColor?: string | null
  capsuleSize?: string | null
  capsuleType?: string | null
  customerService?: string | null
  actualProductionQuantity?: number | null
  materialYieldQuantity?: number | null
  ingredients: CreateIngredientData[]
  worklogs?: CreateOrderWorklogData[]
}

export interface CreateIngredientData {
  materialName: string
  unitContentMg: number
  isCustomerProvided?: boolean
  isCustomerSupplied?: boolean
}

export interface OrderWorklog {
  id: string
  orderId: string
  workDate: string
  headcount: number
  startTime: string
  endTime: string
  notes?: string | null
  effectiveMinutes: number
  calculatedWorkUnits: number
  createdAt: string
  updatedAt: string
}

export interface WorklogWithOrder extends OrderWorklog {
  order?: {
    id: string
    customerName: string
    productName: string
    createdAt: string
  } | null
}

export interface CreateOrderWorklogData {
  workDate: string
  headcount: number
  startTime: string
  endTime: string
  notes?: string
}

export interface UpdateProductionOrderData extends Partial<CreateProductionOrderData> {
  id: string
}

export interface SearchFilters {
  customerName?: string
  productName?: string
  ingredientName?: string
  capsuleType?: string
  dateTo?: Date
  minQuantity?: number
  maxQuantity?: number
  isCompleted?: boolean
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'productionQuantity' | 'customerName' | 'productName' | 'completionDate'
  sortOrder?: 'asc' | 'desc'
}

export interface WeightUnit {
  value: number
  unit: 'mg' | 'g' | 'kg'
  display: string
}

export interface ExportOptions {
  format: 'csv' | 'pdf'
  includeIngredients?: boolean
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface WorklogFilters {
  orderKeyword?: string
  notesKeyword?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
  sortOrder?: 'asc' | 'desc'
}

// ===== 配方庫類型定義 =====

/**
 * 配方原料（簡化版，用於 JSON 儲存）
 */
export interface RecipeIngredient {
  materialName: string
  unitContentMg: number
  isCustomerProvided: boolean
  isCustomerSupplied: boolean
}

/**
 * 配方庫項目（完整資料）
 */
export interface RecipeLibraryItem {
  id: string
  recipeName: string
  description?: string | null
  sourceOrderIds: string[] // 來源訂單 ID 列表
  customerName: string
  productName: string
  ingredients: RecipeIngredient[]
  unitWeightMg: number
  recipeFingerprint: string
  capsuleColor?: string | null
  capsuleSize?: string | null
  capsuleType?: string | null
  category?: string | null
  tags?: string[]
  productionCount: number // 生產次數
  usageCount: number // 使用次數（創建訂單）
  lastUsedAt?: Date | null
  lastProductionAt?: Date | null
  notes?: string | null
  aiEffectsAnalysis?: string | null // AI 分析的配方功效
  aiAnalyzedAt?: Date | null // AI 分析時間
  
  // 🆕 AI 優化建議
  aiSuggestions?: string | null      // JSON string
  aiSuggestionsAt?: Date | null
  
  // 🆕 原料相互作用分析
  aiInteractions?: string | null     // JSON string
  aiInteractionsAt?: Date | null
  
  recipeType: 'production' | 'template' // 🆕 配方類型
  sourceType: 'order' | 'manual' | 'batch_import' // 🆕 配方來源
  isActive: boolean
  createdBy?: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 創建配方資料
 */
export interface CreateRecipeData {
  recipeName: string
  description?: string
  sourceOrderId: string // 單個來源訂單
  customerName: string
  productName: string
  ingredients: RecipeIngredient[]
  unitWeightMg: number
  recipeFingerprint: string
  capsuleColor?: string
  capsuleSize?: string
  capsuleType?: string
  category?: string
  tags?: string[]
  notes?: string
  lastProductionAt?: Date
  recipeType?: 'production' | 'template' // 🆕 配方類型
  sourceType?: 'order' | 'manual' | 'batch_import' // 🆕 配方來源
}

/**
 * 更新配方資料
 */
export interface UpdateRecipeData {
  recipeName?: string
  description?: string
  category?: string
  tags?: string[]
  notes?: string
  aiEffectsAnalysis?: string | null
  aiAnalyzedAt?: Date | null
}

/**
 * 配方搜尋篩選條件
 */
export interface RecipeSearchFilters {
  keyword?: string // 搜尋配方名稱、客戶、產品
  ingredientName?: string // 搜尋原料名稱
  customerName?: string
  productName?: string
  category?: string
  capsuleSize?: string
  capsuleType?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'productionCount' | 'usageCount' | 'recipeName' | 'lastProductionAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 批量導入結果
 */
export interface BatchImportResult {
  total: number // 總共處理的訂單數
  imported: number // 新增的配方數
  updated: number // 更新的配方數
  skipped: number // 跳過的訂單數（已存在且已記錄）
  errors: number // 錯誤數
  details: Array<{
    orderId: string
    status: 'imported' | 'updated' | 'skipped' | 'error'
    message?: string
  }>
}

/**
 * 配方保存檢查結果
 */
export interface RecipeSaveCheck {
  canSave: boolean
  reason?: 'notFound' | 'notCompleted' | 'alreadyExists'
  alreadyExists: boolean
  existingRecipe?: RecipeLibraryItem | null
}

/**
 * 配方統計資訊
 */
export interface RecipeStats {
  totalRecipes: number
  totalProductions: number
  totalUsages: number
  topRecipes: Array<{
    id: string
    recipeName: string
    productionCount: number
    usageCount: number
  }>
  recentRecipes: RecipeLibraryItem[]
}

// ===== 統一工作單系統 (Unified Work Order System) =====

export * from './work-order'

