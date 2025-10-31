// Manager Scheduling Table Types

import { WorkType } from '@prisma/client'

export interface ManagerSchedulingEntry {
  id: string
  workOrderId: string
  priority: number
  processIssues: string | null
  qualityNotes: string | null
  expectedProductionStartDate: string | null
  createdAt: Date  // System-generated, NOT editable
  updatedAt: Date
  createdBy: string | null
  workOrder: {
    id: string
    createdAt: Date  // System-generated, NOT editable
    customerName: string
    personInChargeId: string | null
    personInCharge: { 
      id: string
      nickname: string | null
      phoneE164: string 
    } | null
    workType: WorkType
    expectedProductionMaterialsDate: Date | null
    productionMaterialsReady: boolean
    workDescription: string
    productionQuantity: number | null
    capsulationOrder?: {
      id: string
      processIssues: string | null
      qualityNotes: string | null
      worklogs: Array<{ id: string }>
      completionDate: Date | null
    } | null
    productionOrder?: {
      id: string
      processIssues: string | null
      qualityNotes: string | null
      worklogs: Array<{ id: string }>
      completionDate: Date | null
    } | null
  }
}

export interface UpdateSchedulingEntryInput {
  priority?: number
  processIssues?: string | null
  qualityNotes?: string | null
  expectedProductionStartDate?: string | null
  // Work order fields
  customerName?: string
  personInChargeId?: string | null
  workType?: WorkType
  expectedProductionMaterialsDate?: Date | null
  productionMaterialsReady?: boolean
  workDescription?: string
  productionQuantity?: number | null
}

export interface CreateSchedulingEntryInput {
  workOrderId: string
}

export interface ReorderSchedulingInput {
  updates: Array<{
    id: string
    priority: number
  }>
}

export interface SchedulingEntryWithWorkOrder extends ManagerSchedulingEntry {
  workOrder: ManagerSchedulingEntry['workOrder'] & {
    id: string
    jobNumber: string | null
  }
}

