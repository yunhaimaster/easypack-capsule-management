/**
 * Sync Work Order Completion Status
 * 
 * Ensures that `status` and `isCompleted` fields are always in sync.
 * 
 * Rules:
 * - If `status = 'COMPLETED'`, then `isCompleted` must be `true`
 * - If `isCompleted = true`, then `status` must be `'COMPLETED'`
 * - If `status != 'COMPLETED'` and `isCompleted = false`, they're already in sync
 * 
 * This function fixes inconsistencies by prioritizing `status = 'COMPLETED'` as the source of truth
 * for "completed" state, and syncing `isCompleted` to match.
 */

import { WorkOrderStatus } from '@prisma/client'

interface CompletionSyncResult {
  needsSync: boolean
  updates: {
    status?: WorkOrderStatus | null
    isCompleted?: boolean
    statusUpdatedAt?: Date
    statusUpdatedBy?: string
  }
}

/**
 * Determines if status and isCompleted need to be synced
 * Returns the updates needed to sync them
 */
export function syncCompletionStatus(params: {
  currentStatus: WorkOrderStatus | null
  currentIsCompleted: boolean
  userId?: string
}): CompletionSyncResult {
  const { currentStatus, currentIsCompleted, userId } = params
  const updates: CompletionSyncResult['updates'] = {}
  let needsSync = false

  // Case 1: status = 'COMPLETED' but isCompleted = false
  // Sync: Set isCompleted = true
  if (currentStatus === 'COMPLETED' && !currentIsCompleted) {
    updates.isCompleted = true
    needsSync = true
  }

  // Case 2: isCompleted = true but status != 'COMPLETED'
  // Sync: Set status = 'COMPLETED'
  if (currentIsCompleted && currentStatus !== 'COMPLETED') {
    updates.status = 'COMPLETED'
    updates.statusUpdatedAt = new Date()
    if (userId) {
      updates.statusUpdatedBy = userId
    }
    needsSync = true
  }

  // Case 3: Both are in sync (no action needed)
  // status = 'COMPLETED' && isCompleted = true ✓
  // status != 'COMPLETED' && isCompleted = false ✓

  return {
    needsSync,
    updates
  }
}

/**
 * Prepares update data with synced completion status
 * Call this before updating a work order to ensure fields stay in sync
 */
export function prepareCompletionSync(updateData: {
  status?: WorkOrderStatus | null
  isCompleted?: boolean
  statusUpdatedAt?: Date
  statusUpdatedBy?: string
}, existingWorkOrder: {
  status: WorkOrderStatus | null
  isCompleted: boolean
}, userId?: string): {
  status?: WorkOrderStatus | null
  isCompleted?: boolean
  statusUpdatedAt?: Date
  statusUpdatedBy?: string
} {
  // Determine what the final values will be after the update
  const finalStatus = updateData.status !== undefined ? updateData.status : existingWorkOrder.status
  const finalIsCompleted = updateData.isCompleted !== undefined ? updateData.isCompleted : existingWorkOrder.isCompleted

  // Check if sync is needed
  const syncResult = syncCompletionStatus({
    currentStatus: finalStatus,
    currentIsCompleted: finalIsCompleted,
    userId
  })

  // Merge the sync updates into the update data
  if (syncResult.needsSync) {
    return {
      ...updateData,
      ...syncResult.updates
    }
  }

  return updateData
}

