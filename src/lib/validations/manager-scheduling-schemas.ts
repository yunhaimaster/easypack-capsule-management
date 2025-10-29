// Manager Scheduling Table Validation Schemas

import { z } from 'zod'
import { workTypeSchema } from './work-order-schemas'

/**
 * Schema for creating a new scheduling entry
 */
export const createSchedulingEntrySchema = z.object({
  workOrderId: z.string().cuid('無效的工作單ID')
})

/**
 * Schema for updating a scheduling entry
 * 
 * Note: createdAt is explicitly excluded - it's system-generated only
 */
export const updateSchedulingEntrySchema = z.object({
  priority: z.number().int().positive('優先級必須是正整數').optional(),
  processIssues: z.string().nullable().optional(),
  qualityNotes: z.string().nullable().optional(),
  expectedProductionStartDate: z.string().max(200, '預計開產日期長度不能超過200字符').nullable().optional(),
  // Work order fields
  customerName: z.string().min(1, '客戶名稱不能為空').max(200, '客戶名稱長度不能超過200字符').optional(),
  personInChargeId: z.string().cuid('無效的負責人ID').nullable().optional(),
  workType: workTypeSchema.optional(),
  expectedProductionMaterialsDate: z.string().datetime('無效的日期格式').nullable().optional(),
  productionMaterialsReady: z.boolean().optional(),
  workDescription: z.string().optional(),
  productionQuantity: z.number().int().positive('生產數量必須是正整數').nullable().optional()
})

/**
 * Schema for reordering scheduling entries
 */
export const reorderSchedulingSchema = z.object({
  updates: z.array(z.object({
    id: z.string().cuid('無效的排單表ID'),
    priority: z.number().int().positive('優先級必須是正整數')
  })).min(1, '至少需要一個更新項')
})

/**
 * Schema for export options
 */
export const exportSchedulingSchema = z.object({
  format: z.enum(['csv', 'xlsx'], {
    errorMap: () => ({ message: '格式必須是 csv 或 xlsx' })
  }),
  columns: z.array(z.string()).min(1, '至少需要選擇一個欄位'),
  encoding: z.enum(['utf8', 'utf8-bom']).default('utf8-bom')
})

export type CreateSchedulingEntryInput = z.infer<typeof createSchedulingEntrySchema>
export type UpdateSchedulingEntryInput = z.infer<typeof updateSchedulingEntrySchema>
export type ReorderSchedulingInput = z.infer<typeof reorderSchedulingSchema>
export type ExportSchedulingInput = z.infer<typeof exportSchedulingSchema>

