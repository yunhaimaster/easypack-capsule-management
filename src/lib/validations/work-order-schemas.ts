/**
 * Zod Validation Schemas for Work Order System
 * 
 * These schemas are used to validate API request/response data
 * for the unified work order management system.
 */

import { z } from 'zod'
import { WorkOrderStatus, WorkType } from '@prisma/client'

// ===== Enum Schemas =====

export const workOrderStatusSchema = z.nativeEnum(WorkOrderStatus)
export const workTypeSchema = z.nativeEnum(WorkType)

// ===== Ingredient Schema =====

export const createIngredientSchema = z.object({
  materialName: z.string().min(1, '原料名稱不能為空').max(200).trim(),
  unitContentMg: z.number().positive('含量必須大於0'),
  isCustomerProvided: z.boolean().default(true),
  isCustomerSupplied: z.boolean().default(true)
})

// ===== Capsulation Order Schema =====

export const createCapsulationOrderSchema = z.object({
  productName: z.string().min(1, '產品名稱為必填項').max(200).trim(),
  productionQuantity: z.number().int().positive('生產數量必須大於0'),
  completionDate: z.string().datetime().optional().nullable(),
  capsuleColor: z.string().max(50).optional().nullable(),
  capsuleSize: z.string().max(20).optional().nullable(),
  capsuleType: z.string().max(50).optional().nullable(),
  customerServiceId: z.string().cuid('無效的客服ID').optional().nullable(),
  ingredients: z.array(createIngredientSchema).min(1, '至少需要一個原料')
})

// ===== Work Order Schemas =====

export const createWorkOrderSchema = z.object({
  // 基本信息
  jobNumber: z.string().max(100).trim().optional().nullable(),  // 訂單編號（如有）- 可選
  customerName: z.string().min(1, '客戶名稱為必填項').max(200).trim(),
  personInChargeId: z.string().cuid('無效的負責人ID'),
  workType: workTypeSchema,
  
  // VIP標記
  isCustomerServiceVip: z.boolean().default(false),  // 客服VIP
  isBossVip: z.boolean().default(false),  // 老闆VIP
  
  // 物料到齊狀態
  expectedProductionMaterialsDate: z.string().datetime().optional().nullable(),  // 預計生產物料到齊的日期
  expectedPackagingMaterialsDate: z.string().datetime().optional().nullable(),  // 預計包裝物料到齊的日期
  productionMaterialsReady: z.boolean().default(false),  // 生產物料齊
  packagingMaterialsReady: z.boolean().default(false),  // 包裝物料齊
  
  // 數量
  productionQuantity: z.number().int().positive().optional().nullable(),
  packagingQuantity: z.number().int().positive().optional().nullable(),
  
  // 交貨期
  requestedDeliveryDate: z.string().datetime().optional().nullable(),  // 要求交貨的日期
  internalExpectedDate: z.string().datetime().optional().nullable(),  // 內部預計交貨期
  
  // 狀態標記
  isUrgent: z.boolean().default(false),  // 客人要求加急
  productionStarted: z.boolean().default(false),  // 已開生產線
  isCompleted: z.boolean().default(false),  // 已經完成
  
  // 工作描述
  workDescription: z.string().min(1, '工作描述為必填項').trim(),
  
  // 關聯數據
  capsulationOrder: createCapsulationOrderSchema.optional()
})

export const updateWorkOrderSchema = z.object({
  jobNumber: z.string().max(100).trim().optional().nullable(),
  status: workOrderStatusSchema.optional(),
  customerName: z.string().min(1).max(200).trim().optional(),
  personInChargeId: z.string().cuid('無效的負責人ID').optional(),
  workType: workTypeSchema.optional(),
  
  // VIP標記
  isCustomerServiceVip: z.boolean().optional(),
  isBossVip: z.boolean().optional(),
  
  // 物料到齊狀態
  expectedProductionMaterialsDate: z.string().datetime().optional().nullable(),
  expectedPackagingMaterialsDate: z.string().datetime().optional().nullable(),
  productionMaterialsReady: z.boolean().optional(),
  packagingMaterialsReady: z.boolean().optional(),
  
  // 數量
  productionQuantity: z.number().int().positive().optional().nullable(),
  packagingQuantity: z.number().int().positive().optional().nullable(),
  
  // 交貨期
  requestedDeliveryDate: z.string().datetime().optional().nullable(),
  internalExpectedDate: z.string().datetime().optional().nullable(),
  
  // 狀態標記
  isUrgent: z.boolean().optional(),
  productionStarted: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  
  // 工作描述
  workDescription: z.string().min(1).trim().optional(),
  
  // 關聯數據
  capsulationOrder: z.object({
    productName: z.string().min(1).max(200).trim().optional(),
    productionQuantity: z.number().int().positive().optional(),
    completionDate: z.string().datetime().optional().nullable(),
    capsuleColor: z.string().max(50).optional().nullable(),
    capsuleSize: z.string().max(20).optional().nullable(),
    capsuleType: z.string().max(50).optional().nullable(),
    customerServiceId: z.string().cuid('無效的客服ID').optional().nullable(),
    ingredients: z.array(createIngredientSchema).min(1).optional()
  }).optional()
}).refine(data => {
  // Additional validation can be done here
  // Status transition validation will be done in API layer
  return true
})

// ===== Bulk Update Schema =====

export const bulkUpdateSchema = z.object({
  workOrderIds: z.array(z.string().cuid('無效的工作單ID')).min(1, '至少選擇一個工作單'),
  updates: z.object({
    personInChargeId: z.string().cuid('無效的負責人ID').optional(),
    status: workOrderStatusSchema.optional(),
    workType: workTypeSchema.optional(),
    expectedCompletionDate: z.string().datetime().optional().nullable()
  }).refine(data => {
    // At least one field must be provided
    return Object.keys(data).length > 0
  }, '至少需要更新一個欄位')
})

// ===== Search Filters Schema =====

export const searchFiltersSchema = z.object({
  keyword: z.string().optional(),
  customerName: z.string().optional(),
  personInCharge: z.array(z.string().cuid()).optional(),
  workType: z.array(workTypeSchema).optional(),
  status: z.array(workOrderStatusSchema).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
  sortBy: z.enum(['createdAt', 'expectedCompletionDate', 'customerName', 'jobNumber', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// ===== Export Options Schema =====

export const exportOptionsSchema = z.object({
  format: z.enum(['csv', 'xlsx']),
  columns: z.array(z.string()).min(1, '至少選擇一個欄位'),
  workOrderIds: z.array(z.string().cuid()).optional(),
  includeLinkedOrders: z.boolean().default(false),
  encoding: z.enum(['utf8-bom', 'utf8']).default('utf8-bom')
})

// ===== Import Data Schema =====

export const importDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.record(z.any())),
  userMappings: z.record(z.string()).optional(),
  dryRun: z.boolean().default(true)
})

// ===== Type exports for use in application =====

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>
export type ExportOptionsInput = z.infer<typeof exportOptionsSchema>
export type ImportDataInput = z.infer<typeof importDataSchema>

