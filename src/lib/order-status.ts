import { ProductionOrderStatus } from '@prisma/client'

/**
 * Calculate ProductionOrder status based on worklogs and completionDate
 * 
 * Logic matches frontend determineStatus:
 * - If completionDate is set → COMPLETED
 * - Else if has worklogs → IN_PROGRESS
 * - Else → NOT_STARTED
 */
export function calculateOrderStatus(data: {
  worklogs?: { id: string }[]
  worklogsCount?: number  // Alternative: count instead of array
  completionDate: Date | null
}): ProductionOrderStatus {
  const hasWorklog = (data.worklogs?.length ?? data.worklogsCount ?? 0) > 0
  const completed = Boolean(data.completionDate)
  
  if (completed) return ProductionOrderStatus.COMPLETED
  if (hasWorklog) return ProductionOrderStatus.IN_PROGRESS
  return ProductionOrderStatus.NOT_STARTED
}

