/**
 * Work Order Form Validation Schema
 * 
 * FLEXIBLE VALIDATION designed for:
 * - Historical data import (past dates allowed)
 * - Different measurement units (packaging bottles vs production pills)
 * - Partial order information (quantities often TBD at order time)
 * 
 * NO restrictive business logic that would prevent importing old data
 */

import { z } from 'zod'
import { WorkType } from '@prisma/client'

export const workOrderFormSchema = z.object({
  // Basic Information
  jobNumber: z.string().max(50, "訂單編號不能超過50字元").optional().nullable(),
  customerName: z.string().min(1, "客戶名稱為必填").max(100, "客戶名稱不能超過100字元"),
  personInChargeId: z.string().uuid("請選擇負責人"),
  workType: z.nativeEnum(WorkType, { errorMap: () => ({ message: "請選擇工作類型" }) }),
  workDescription: z.string().min(10, "工作描述至少需要10個字").max(1000, "工作描述不能超過1000字元"),
  
  // VIP Flags
  isCustomerServiceVip: z.boolean(),
  isBossVip: z.boolean(),
  
  // Material Dates - No restrictions for historical data
  expectedProductionMaterialsDate: z.string().optional().nullable(),
  expectedPackagingMaterialsDate: z.string().optional().nullable(),
  productionMaterialsReady: z.boolean(),
  packagingMaterialsReady: z.boolean(),
  
  // Quantities - FULLY OPTIONAL
  // Different units: bottles vs pills, so no cross-validation
  productionQuantity: z.union([
    z.number().int("必須為整數").positive("數量必須大於0"),
    z.null()
  ]).optional(),
  packagingQuantity: z.union([
    z.number().int("必須為整數").positive("數量必須大於0"),
    z.null()
  ]).optional(),
  
  // Delivery Dates - Allow past dates for historical data import
  requestedDeliveryDate: z.string().optional().nullable(),
  internalExpectedDate: z.string().optional().nullable(),
  
  // Status Flags
  isUrgent: z.boolean(),
  productionStarted: z.boolean(),
  isCompleted: z.boolean(),
})

export type WorkOrderFormData = z.infer<typeof workOrderFormSchema>

