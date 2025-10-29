// Work Order System Types

import { WorkOrderStatus, WorkType } from '@prisma/client'

// ===== Unified Work Order System =====

export { WorkOrderStatus, WorkType }

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  PACKAGING: '包裝',
  PRODUCTION: '生產',
  PRODUCTION_PACKAGING: '生產+包裝',
  WAREHOUSING: '倉務',
}

export const WORK_TYPE_SHORT_LABELS: Record<WorkType, string> = {
  PACKAGING: '包裝',
  PRODUCTION: '生產',
  PRODUCTION_PACKAGING: '產+包',
  WAREHOUSING: '倉務',
}

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  PAUSED: '已暫停',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

export interface WorkOrder {
  id: string
  jobNumber?: string | null  // 訂單編號（如有）- 改為可選
  status: WorkOrderStatus | null  // Nullable - NULL means ongoing work
  statusUpdatedAt?: Date | null
  statusUpdatedBy?: string | null
  markedDate: Date  // 記號日期（系統自動記錄創建時間）
  customerName: string
  personInChargeId: string
  personInCharge?: UserBadgeData
  workType: WorkType
  
  // VIP標記
  isCustomerServiceVip: boolean  // 客服VIP
  isBossVip: boolean  // 老闆VIP
  
  // 物料到齊狀態
  expectedProductionMaterialsDate?: Date | null  // 預計生產物料到齊的日期
  expectedPackagingMaterialsDate?: Date | null  // 預計包裝物料到齊的日期
  productionMaterialsReady: boolean  // 生產物料齊
  packagingMaterialsReady: boolean  // 包裝物料齊
  
  // 數量
  productionQuantity?: number | null
  packagingQuantity?: number | null
  
  // 交貨期
  requestedDeliveryDate?: Date | null  // 要求交貨的日期
  internalExpectedDate?: Date | null  // 內部預計交貨期
  
  // 狀態標記
  isUrgent: boolean  // 客人要求加急
  productionStarted: boolean  // 已開生產線
  isCompleted: boolean  // 已經完成
  
  // 工作描述
  workDescription: string
  
  // 保留舊欄位（標記為廢棄）
  isNewProductVip?: boolean  // @deprecated
  isComplexityVip?: boolean  // @deprecated
  yearCategory?: string | null  // @deprecated
  expectedCompletionDate?: Date | null  // @deprecated
  dataCompleteDate?: Date | null  // @deprecated
  notifiedDate?: Date | null
  paymentReceivedDate?: Date | null
  shippedDate?: Date | null
  productionQuantityStat?: string | null
  packagingQuantityStat?: string | null
  internalDeliveryTime?: string | null  // @deprecated
  customerRequestedTime?: string | null  // @deprecated
  tokyoData?: string | null
  notes?: string | null
  
  capsulationOrder?: CapsulationOrder | null
  
  // NEW: Linked production orders (1:many relationship)
  productionOrders?: Array<{
    id: string
    productName: string
    customerName: string
    productionQuantity: number
    createdAt?: string | Date
  }>
  
  // Backward compatibility: First order as productionOrder
  productionOrder?: {
    id: string
    productName: string
    customerName: string
    productionQuantity?: number
  } | null
  
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
}

export interface CapsulationOrder {
  id: string
  workOrderId: string
  productName: string
  productionQuantity: number
  unitWeightMg: number
  batchTotalWeightMg: number
  completionDate?: Date | null
  customerServiceId?: string | null
  customerService?: UserBadgeData | null
  capsuleColor?: string | null
  capsuleSize?: string | null
  capsuleType?: string | null
  processIssues?: string | null
  qualityNotes?: string | null
  actualProductionQuantity?: number | null
  materialYieldQuantity?: number | null
  lockPassword?: string | null
  ingredients: CapsulationIngredient[]
  worklogs?: CapsulationWorklog[]
  createdAt: Date
  updatedAt: Date
}

export interface CapsulationIngredient {
  id: string
  orderId: string
  materialName: string
  unitContentMg: number
  isCustomerProvided: boolean
  isCustomerSupplied: boolean
}

export interface CapsulationWorklog {
  id: string
  orderId: string
  workDate: string | Date
  headcount: number
  startTime: string
  endTime: string
  notes?: string | null
  effectiveMinutes: number
  calculatedWorkUnits: number
  createdAt: string | Date
  updatedAt: string | Date
}

export interface UserBadgeData {
  id: string
  nickname?: string | null
  phoneE164: string
}

// ===== Create/Update Data Types =====

export interface CreateWorkOrderData {
  jobNumber?: string | null  // 訂單編號（如有）- 可選
  customerName: string
  personInChargeId: string | null
  workType: WorkType
  
  // VIP標記
  isCustomerServiceVip?: boolean  // 客服VIP
  isBossVip?: boolean  // 老闆VIP
  
  // 物料到齊狀態
  expectedProductionMaterialsDate?: Date | null
  expectedPackagingMaterialsDate?: Date | null
  productionMaterialsReady?: boolean
  packagingMaterialsReady?: boolean
  
  // 數量
  productionQuantity?: number | null
  packagingQuantity?: number | null
  
  // 交貨期
  requestedDeliveryDate?: Date | null
  internalExpectedDate?: Date | null
  
  // 狀態標記
  isUrgent?: boolean
  productionStarted?: boolean
  isCompleted?: boolean
  
  // 工作描述
  workDescription: string
  
  capsulationOrder?: CreateCapsulationOrderData
}

export interface CreateCapsulationOrderData {
  productName: string
  productionQuantity: number
  completionDate?: Date | null
  capsuleColor?: string
  capsuleSize?: string
  capsuleType?: string
  customerServiceId?: string
  ingredients: CreateCapsulationIngredientData[]
}

export interface CreateCapsulationIngredientData {
  materialName: string
  unitContentMg: number
  isCustomerProvided?: boolean
  isCustomerSupplied?: boolean
}

export interface UpdateWorkOrderData {
  jobNumber?: string | null
  status?: WorkOrderStatus | null  // Nullable - NULL means ongoing work
  customerName?: string
  personInChargeId?: string | null
  workType?: WorkType
  workDescription?: string
  
  // VIP標記
  isCustomerServiceVip?: boolean
  isBossVip?: boolean
  
  // 物料到齊狀態
  expectedProductionMaterialsDate?: string | null
  expectedPackagingMaterialsDate?: string | null
  productionMaterialsReady?: boolean
  packagingMaterialsReady?: boolean
  
  // 數量
  productionQuantity?: number | null
  productionQuantityStat?: string | null  // Unit for production quantity (粒/瓶/盒/個)
  packagingQuantity?: number | null
  packagingQuantityStat?: string | null   // Unit for packaging quantity (粒/瓶/盒/個)
  
  // 交貨期
  requestedDeliveryDate?: string | null
  internalExpectedDate?: string | null
  
  // 狀態標記
  isUrgent?: boolean
  productionStarted?: boolean
  isCompleted?: boolean
  
  // Capsulation order update (optional, only included if capsulation order exists)
  capsulationOrder?: {
    processIssues?: string | null
    qualityNotes?: string | null
    productName?: string
    productionQuantity?: number
    completionDate?: string | null
    capsuleColor?: string | null
    capsuleSize?: string | null
    capsuleType?: string | null
    customerServiceId?: string | null
    ingredients?: Array<{
      materialName: string
      unitContentMg: number
      isCustomerProvided: boolean
      isCustomerSupplied: boolean
    }>
  }
  
  // Legacy fields (deprecated but still accepted)
  isNewProductVip?: boolean
  isComplexityVip?: boolean
  expectedCompletionDate?: Date | null
  dataCompleteDate?: Date | null
  notifiedDate?: Date | null
  paymentReceivedDate?: Date | null
  shippedDate?: Date | null
  notes?: string
}

// ===== Search & Filter Types =====

export type SortField = 'jobNumber' | 'customerName' | 'status' | 'markedDate' | 'createdAt' | 'workType' | 'personInCharge' | 'requestedDeliveryDate'

export interface CreateWorkOrderPayload {
  jobNumber?: string | null
  customerName: string
  personInChargeId: string | null
  workType: WorkType
  workDescription: string
  isCustomerServiceVip: boolean
  isBossVip: boolean
  expectedProductionMaterialsDate?: Date | null
  expectedPackagingMaterialsDate?: Date | null
  productionMaterialsReady: boolean
  packagingMaterialsReady: boolean
  productionQuantity?: number | null
  packagingQuantity?: number | null
  requestedDeliveryDate?: Date | null
  internalExpectedDate?: Date | null
  isUrgent: boolean
  productionStarted: boolean
  isCompleted: boolean
}

export interface User {
  id: string
  phoneE164: string
  nickname?: string | null
  role: string
}

export interface WorkOrderSearchFilters {
  keyword?: string
  customerName?: string
  personInCharge?: string[]  // Array of user IDs
  workType?: WorkType[]
  status?: (WorkOrderStatus | null)[]  // Include null for ongoing work
  dateFrom?: string  // ISO date string
  dateTo?: string    // ISO date string
  hasLinkedCapsulation?: boolean
  isVip?: boolean
  page?: number
  limit?: number
  sortBy?: SortField
  sortOrder?: 'asc' | 'desc'
  
  // Advanced filters for smart presets
  productionMaterialsReady?: boolean
  packagingMaterialsReady?: boolean
  productionStarted?: boolean
  isUrgent?: boolean
  isCompleted?: boolean
}

// ===== Bulk Operations =====

export interface BulkUpdateData {
  workOrderIds: string[]
  updates: {
    personInChargeId?: string
    status?: WorkOrderStatus
    workType?: WorkType
    expectedCompletionDate?: Date | null
  }
}

export interface BulkOperationResult {
  success: boolean
  updated: number
  failed: number
  errors?: Array<{
    workOrderId: string
    error: string
  }>
}

// ===== Import/Export Types =====

export interface ExportOptions {
  format: 'csv' | 'xlsx'
  columns: string[]
  includeLinkedOrders?: boolean
  encoding?: 'utf8-bom' | 'utf8'
  workOrderIds?: string[]  // If provided, export only these orders
}

export interface ImportData {
  headers: string[]
  rows: Record<string, any>[]
  errors?: Array<{
    row: number
    field: string
    message: string
  }>
}

export interface ColumnMapping {
  [spreadsheetColumn: string]: string  // Maps to WorkOrder field
}

export interface UserMapping {
  [personName: string]: string  // Maps to User ID
}

export enum ValidationLevel {
  BLOCKING = 'blocking',  // Skip row
  WARNING = 'warning',     // Import with warning
  INFO = 'info'           // Import with note
}

export interface ValidationError {
  row: number
  field: string
  level: ValidationLevel
  message: string
  suggestedFix?: any
}

export interface ImportValidationResult {
  valid: number
  warnings: number
  errors: number
  details: ValidationError[]
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: number
  details: Array<{
    row: number
    workOrderId?: string
    status: 'imported' | 'skipped' | 'error'
    message?: string
  }>
}

// ===== User Mapping Types =====

export interface UserMappingResult {
  matched: Record<string, string>  // name -> userId
  ambiguous: Record<string, UserBadgeData[]>  // name -> possible users
  notFound: string[]  // names with no match
}

// ===== Status Transition Types =====

// Helper function to get valid transitions
export function getValidStatusTransitions(currentStatus: WorkOrderStatus | null): Array<WorkOrderStatus | null> {
  // Ongoing (null status) can transition to any status
  if (currentStatus === null) {
    return ['PAUSED', 'COMPLETED', 'CANCELLED']
  }
  
  // Status-specific transitions
  const transitions: Record<WorkOrderStatus, Array<WorkOrderStatus | null>> = {
    PAUSED: [null, 'COMPLETED', 'CANCELLED'],  // Can unpause (null), complete, or cancel
    COMPLETED: [],                              // Final state
    CANCELLED: []                               // Final state
  }
  
  return transitions[currentStatus] || []
}

// Keep for backward compatibility
export const VALID_STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  PAUSED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
}

export function canTransitionStatus(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to)
}

// ===== Column Visibility =====

export interface ColumnVisibilityState {
  jobNumber: boolean
  customerName: boolean
  personInCharge: boolean
  workType: boolean
  status: boolean
  expectedCompletionDate: boolean
  markedDate: boolean
  dataCompleteDate: boolean
  notifiedDate: boolean
  paymentReceivedDate: boolean
  shippedDate: boolean
  productionQuantity: boolean
  packagingQuantity: boolean
  yearCategory: boolean
  vipFlags: boolean
  actions: boolean
}

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibilityState = {
  jobNumber: true,
  customerName: true,
  personInCharge: true,
  workType: true,
  status: true,
  expectedCompletionDate: true,
  markedDate: false,
  dataCompleteDate: false,
  notifiedDate: false,
  paymentReceivedDate: false,
  shippedDate: false,
  productionQuantity: false,
  packagingQuantity: false,
  yearCategory: false,
  vipFlags: true,
  actions: true,
}

