// ===== v2.0 新增類型定義 =====

// AI 配方相關類型
export interface AIRecipeRequest {
  targetEffect: string
  targetAudience?: string
  dosageForm?: 'capsule' | 'tablet' | 'powder'
  budget?: string
  enableReasoning?: boolean
}

export interface AIRecipeResponse {
  success: boolean
  recipe: {
    id: string
    content: string
    structured: ParsedRecipe
    createdAt: string
  }
}

export interface ParsedRecipe {
  name: string
  description: string
  ingredients: RecipeIngredient[]
  dosage: DosageInfo
  efficacyScore: number | null
  safetyScore: number | null
  costAnalysis: CostAnalysis | null
}

export interface RecipeIngredient {
  name: string
  dosage: string
  description: string
}

export interface DosageInfo {
  recommendation: string
  adultDosage?: string
  timing?: string
}

export interface CostAnalysis {
  unitCost: number
  currency: string
  breakdown?: string
}

// 價格分析相關類型
export interface PriceAnalysisRequest {
  materialName: string
  analysisType?: 'comprehensive' | 'trend' | 'supplier' | 'cost'
  enableReasoning?: boolean
}

export interface PriceAnalysisResponse {
  success: boolean
  analysis: {
    materialName: string
    content: string
    priceData: PriceData[]
    generatedAt: string
  }
}

export interface PriceData {
  id: string
  materialName: string
  supplier: string
  price: number
  currency: string
  unit: string
  minimumOrder?: number
  leadTime?: string
  quality: 'A' | 'B' | 'C'
  source?: string
  validFrom: Date
  validTo?: Date
  createdAt: Date
  updatedAt: Date
}

// 功效評估相關類型
export interface EfficacyAssessmentRequest {
  ingredientName: string
  effect: string
  dosage: number
  enableReasoning?: boolean
}

export interface EfficacyAssessmentResponse {
  success: boolean
  assessment: {
    ingredientName: string
    effect: string
    content: string
    evidenceLevel: 'A' | 'B' | 'C' | 'D'
    safetyScore: number
    efficacyScore: number
    generatedAt: string
  }
}

// 廣告詞生成相關類型
export interface AdCopyRequest {
  productId?: string
  targetMarket: string
  copyType: 'headline' | 'description' | 'benefit' | 'warning'
  productInfo: ProductInfo
  enableReasoning?: boolean
}

export interface ProductInfo {
  name: string
  effects: string[]
  targetAudience: string
  dosageForm: string
}

export interface AdCopyResponse {
  success: boolean
  adCopy: {
    id: string
    content: string
    copyType: string
    regulatoryCompliant: boolean
    evidenceBased: boolean
    generatedAt: string
  }
}

// 工作單生成相關類型
export interface WorkOrderRequest {
  orderId: string
  isoStandard?: string
  enableReasoning?: boolean
}

export interface WorkOrderResponse {
  success: boolean
  workOrder: {
    id: string
    orderNumber: string
    content: string
    structured: WorkOrderData
    generatedAt: string
  }
}

export interface WorkOrderData {
  productionSteps: ProductionStep[]
  qualityControlPoints: QualityControlPoint[]
  riskAssessment: RiskAssessment
  isoCompliant: boolean
}

export interface ProductionStep {
  stepNumber: number
  description: string
  parameters: Record<string, any>
  duration: string
  responsible: string
}

export interface QualityControlPoint {
  checkpoint: string
  testMethod: string
  acceptanceCriteria: string
  frequency: string
}

export interface RiskAssessment {
  risks: RiskItem[]
  mitigationMeasures: string[]
  overallRiskLevel: 'Low' | 'Medium' | 'High'
}

export interface RiskItem {
  risk: string
  probability: 'Low' | 'Medium' | 'High'
  impact: 'Low' | 'Medium' | 'High'
  description: string
}

// QC 文件生成相關類型
export interface QCFileRequest {
  workOrderId: string
  testMethods?: string[]
  enableReasoning?: boolean
}

export interface QCFileResponse {
  success: boolean
  qcFile: {
    id: string
    content: string
    structured: QCFileData
    generatedAt: string
  }
}

export interface QCFileData {
  testMethods: TestMethod[]
  acceptanceCriteria: AcceptanceCriteria[]
  inspectionRecords: InspectionRecord[]
  isoStandard: string
}

export interface TestMethod {
  testName: string
  method: string
  equipment: string
  duration: string
}

export interface AcceptanceCriteria {
  parameter: string
  specification: string
  tolerance: string
}

export interface InspectionRecord {
  parameter: string
  result: string
  status: 'Pass' | 'Fail' | 'Pending'
  inspector: string
  date: string
}

// 產品資料庫相關類型
export interface ProductDatabaseItem {
  id: string
  productName: string
  category?: string
  formula: any // JSON 對象
  efficacy?: any // JSON 對象
  safety?: any // JSON 對象
  regulatoryStatus?: any // JSON 對象
  version: string
  isActive: boolean
  tags?: string[]
  notes?: string
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductDatabaseRequest {
  productName: string
  category?: string
  formula: any
  efficacy?: any
  safety?: any
  tags?: string[]
  notes?: string
}

export interface ProductDatabaseResponse {
  success: boolean
  product: ProductDatabaseItem
}

// 通用 API 響應類型
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分頁相關類型
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 搜索和篩選類型
export interface SearchParams {
  query?: string
  filters?: Record<string, any>
  pagination?: PaginationParams
}

// 錯誤類型
export interface APIError {
  code: string
  message: string
  details?: any
  timestamp: string
}
