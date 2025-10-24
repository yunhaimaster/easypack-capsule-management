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

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  DRAFT: '草稿',
  PENDING: '待處理',
  DATA_COMPLETE: '資料齊全',
  NOTIFIED: '已通知',
  PAID: '已收數',
  SHIPPED: '已出貨',
  COMPLETED: '已完成',
  ON_HOLD: '暫停',
  CANCELLED: '已取消',
}

export interface WorkOrder {
  id: string
  jobNumber: string
  status: WorkOrderStatus
  statusUpdatedAt?: Date | null
  statusUpdatedBy?: string | null
  markedDate?: Date | null
  customerName: string
  personInChargeId: string
  personInCharge?: UserBadgeData
  workType: WorkType
  isNewProductVip: boolean
  isComplexityVip: boolean
  yearCategory?: string | null
  expectedCompletionDate?: Date | null
  dataCompleteDate?: Date | null
  notifiedDate?: Date | null
  paymentReceivedDate?: Date | null
  shippedDate?: Date | null
  productionQuantityStat?: string | null
  packagingQuantityStat?: string | null
  productionQuantity?: number | null
  packagingQuantity?: number | null
  internalDeliveryTime?: string | null
  customerRequestedTime?: string | null
  tokyoData?: string | null
  workDescription: string
  notes?: string | null
  capsulationOrder?: CapsulationOrder | null
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
  jobNumber: string
  markedDate?: Date | null
  customerName: string
  personInChargeId: string
  workType: WorkType
  isNewProductVip?: boolean
  isComplexityVip?: boolean
  yearCategory?: string
  expectedCompletionDate?: Date | null
  dataCompleteDate?: Date | null
  productionQuantity?: number
  packagingQuantity?: number
  internalDeliveryTime?: string
  customerRequestedTime?: string
  workDescription: string
  notes?: string
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
  jobNumber?: string
  status?: WorkOrderStatus
  customerName?: string
  personInChargeId?: string
  workType?: WorkType
  isNewProductVip?: boolean
  isComplexityVip?: boolean
  expectedCompletionDate?: Date | null
  dataCompleteDate?: Date | null
  notifiedDate?: Date | null
  paymentReceivedDate?: Date | null
  shippedDate?: Date | null
  workDescription?: string
  notes?: string
}

// ===== Search & Filter Types =====

export interface WorkOrderSearchFilters {
  keyword?: string
  customerName?: string
  personInCharge?: string[]  // Array of user IDs
  workType?: WorkType[]
  status?: WorkOrderStatus[]
  dateFrom?: Date
  dateTo?: Date
  hasLinkedCapsulation?: boolean
  isVip?: boolean
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'expectedCompletionDate' | 'customerName' | 'jobNumber' | 'status'
  sortOrder?: 'asc' | 'desc'
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

export const VALID_STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['DATA_COMPLETE', 'ON_HOLD', 'CANCELLED'],
  DATA_COMPLETE: ['NOTIFIED', 'ON_HOLD', 'CANCELLED'],
  NOTIFIED: ['PAID', 'ON_HOLD', 'CANCELLED'],
  PAID: ['SHIPPED', 'ON_HOLD', 'CANCELLED'],
  SHIPPED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  ON_HOLD: ['PENDING', 'CANCELLED'],
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

