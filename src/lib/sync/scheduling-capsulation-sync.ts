/**
 * Bidirectional Sync Utilities for Manager Scheduling Table
 * 
 * Handles synchronization between:
 * - ManagerSchedulingEntry ↔ CapsulationOrder (processIssues, qualityNotes)
 * - ManagerSchedulingEntry ↔ UnifiedWorkOrder (work order fields)
 * 
 * All sync functions return { success, error? } and never throw exceptions.
 * Errors are logged but don't fail the main operation.
 */

import { prisma } from '@/lib/prisma'
import { WorkType } from '@prisma/client'

interface SyncResult {
  success: boolean
  error?: string
}

/**
 * Sync scheduling entry fields to capsulation order or production order
 * 
 * Updates CapsulationOrder.processIssues and qualityNotes when
 * scheduling entry fields are updated.
 * If CapsulationOrder doesn't exist, updates first ProductionOrder instead.
 */
export async function syncToCapsulationOrder(
  workOrderId: string,
  processIssues?: string | null,
  qualityNotes?: string | null
): Promise<SyncResult> {
  try {
    // Check if capsulation order exists first
    const capsulationOrder = await prisma.capsulationOrder.findUnique({
      where: { workOrderId },
      select: { id: true }
    })

    if (capsulationOrder) {
      // Update capsulation order
      const updateData: { processIssues?: string | null; qualityNotes?: string | null } = {}
      if (processIssues !== undefined) updateData.processIssues = processIssues
      if (qualityNotes !== undefined) updateData.qualityNotes = qualityNotes

      if (Object.keys(updateData).length === 0) {
        return { success: true }
      }

      await prisma.capsulationOrder.update({
        where: { id: capsulationOrder.id },
        data: updateData
      })

      return { success: true }
    }

    // No capsulation order, check for production order
    const productionOrder = await prisma.productionOrder.findFirst({
      where: { workOrderId },
      select: { id: true },
      orderBy: { createdAt: 'asc' }
    })

    if (productionOrder) {
      // Update first production order
      const updateData: { processIssues?: string | null; qualityNotes?: string | null } = {}
      if (processIssues !== undefined) updateData.processIssues = processIssues
      if (qualityNotes !== undefined) updateData.qualityNotes = qualityNotes

      if (Object.keys(updateData).length === 0) {
        return { success: true }
      }

      await prisma.productionOrder.update({
        where: { id: productionOrder.id },
        data: updateData
      })

      return { success: true }
    }

    // No capsulation order or production order exists - this is OK
    return { success: true }
  } catch (error) {
    console.error('[Sync] syncToCapsulationOrder failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '同步失敗'
    }
  }
}

/**
 * Sync capsulation order fields to scheduling entry
 * 
 * Updates ManagerSchedulingEntry.processIssues and qualityNotes when
 * capsulation order fields are updated.
 */
export async function syncToSchedulingEntry(
  workOrderId: string,
  processIssues?: string | null,
  qualityNotes?: string | null
): Promise<SyncResult> {
  try {
    // Check if scheduling entry exists
    const schedulingEntry = await prisma.managerSchedulingEntry.findUnique({
      where: { workOrderId },
      select: { id: true }
    })

    if (!schedulingEntry) {
      // No scheduling entry exists - this is OK, sync happens when entry is created
      return { success: true }
    }

    // Update only provided fields
    const updateData: { processIssues?: string | null; qualityNotes?: string | null } = {}
    if (processIssues !== undefined) updateData.processIssues = processIssues
    if (qualityNotes !== undefined) updateData.qualityNotes = qualityNotes

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return { success: true }
    }

    await prisma.managerSchedulingEntry.update({
      where: { id: schedulingEntry.id },
      data: updateData
    })

    return { success: true }
  } catch (error) {
    console.error('[Sync] syncToSchedulingEntry failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '同步失敗'
    }
  }
}

/**
 * Sync scheduling entry fields to work order
 * 
 * Updates UnifiedWorkOrder fields when scheduling entry fields are updated.
 */
export async function syncToWorkOrder(
  workOrderId: string,
  updates: {
    customerName?: string
    personInChargeId?: string | null
    workType?: WorkType
    expectedProductionMaterialsDate?: Date | null
    productionMaterialsReady?: boolean
    workDescription?: string
    productionQuantity?: number | null
  }
): Promise<SyncResult> {
  try {
    // Build update data
    const updateData: {
      customerName?: string
      personInChargeId?: string | null
      workType?: WorkType
      expectedProductionMaterialsDate?: Date | null
      productionMaterialsReady?: boolean
      workDescription?: string
      productionQuantity?: number | null
    } = {}

    if (updates.customerName !== undefined) updateData.customerName = updates.customerName
    if (updates.personInChargeId !== undefined) updateData.personInChargeId = updates.personInChargeId
    if (updates.workType !== undefined) updateData.workType = updates.workType
    if (updates.expectedProductionMaterialsDate !== undefined) {
      updateData.expectedProductionMaterialsDate = updates.expectedProductionMaterialsDate
    }
    if (updates.productionMaterialsReady !== undefined) {
      updateData.productionMaterialsReady = updates.productionMaterialsReady
    }
    if (updates.workDescription !== undefined) updateData.workDescription = updates.workDescription
    if (updates.productionQuantity !== undefined) {
      updateData.productionQuantity = updates.productionQuantity
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return { success: true }
    }

    // Validate personInChargeId exists if provided
    if (updates.personInChargeId !== null && updates.personInChargeId !== undefined) {
      const personExists = await prisma.user.findUnique({
        where: { id: updates.personInChargeId },
        select: { id: true }
      })

      if (!personExists) {
        return {
          success: false,
          error: '負責人不存在'
        }
      }
    }

    await prisma.unifiedWorkOrder.update({
      where: { id: workOrderId },
      data: updateData
    })

    return { success: true }
  } catch (error) {
    console.error('[Sync] syncToWorkOrder failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '同步失敗'
    }
  }
}

