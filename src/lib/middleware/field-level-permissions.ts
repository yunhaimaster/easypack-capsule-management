/**
 * Field-Level Permissions for Manager Scheduling Table
 * 
 * Defines which fields can be edited by which user roles.
 * Implements selective editing permissions as requested:
 * - Manager/Admin: Can edit priority ordering and all fields
 * - All users: Can edit fields that sync with other tables + create order link
 */

import { Role } from '@prisma/client'

/**
 * Field permission matrix for scheduling table operations
 * 
 * Fields are categorized by their sync behavior and business importance:
 * - SYNC_FIELDS: Fields that sync with other tables (CapsulationOrder, ProductionOrder, WorkOrder)
 * - PRIORITY_FIELDS: Fields related to priority ordering (Manager/Admin only)
 * - GENERAL_FIELDS: Other fields that don't sync (Manager/Admin only)
 */
export const FIELD_PERMISSIONS = {
  // Fields that sync with other tables - editable by all users
  SYNC_FIELDS: {
    processIssues: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    qualityNotes: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    customerName: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    workDescription: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    productionQuantity: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    expectedProductionMaterialsDate: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    productionMaterialsReady: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    personInChargeId: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
    workType: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[]
  },
  
  // Priority-related fields - Manager/Admin only
  PRIORITY_FIELDS: {
    priority: ['ADMIN', 'MANAGER'] as Role[],
    expectedProductionStartDate: ['ADMIN', 'MANAGER'] as Role[]
  },
  
  // General fields that don't sync - Manager/Admin only
  GENERAL_FIELDS: {
    // No general fields currently defined
  }
} as const

/**
 * All editable fields combined for easy lookup
 */
export const ALL_EDITABLE_FIELDS = {
  ...FIELD_PERMISSIONS.SYNC_FIELDS,
  ...FIELD_PERMISSIONS.PRIORITY_FIELDS,
  ...FIELD_PERMISSIONS.GENERAL_FIELDS
} as const

/**
 * Check if a user role can edit a specific field
 * 
 * @param userRole - User's role from session
 * @param fieldName - Name of the field to check
 * @returns true if user can edit the field, false otherwise
 * 
 * @example
 * ```typescript
 * if (!canEditField(session.user.role, 'processIssues')) {
 *   return NextResponse.json({ success: false, error: '無權限編輯此欄位' }, { status: 403 })
 * }
 * ```
 */
export function canEditField(
  userRole: string,
  fieldName: keyof typeof ALL_EDITABLE_FIELDS
): boolean {
  const fieldPermissions = ALL_EDITABLE_FIELDS[fieldName]
  if (!fieldPermissions) {
    return false // Field not found in permissions
  }
  
  return fieldPermissions.includes(userRole as Role)
}

/**
 * Get all fields that a user role can edit
 * 
 * @param userRole - User's role from session
 * @returns Array of field names the user can edit
 */
export function getEditableFields(userRole: string): string[] {
  const editableFields: string[] = []
  
  for (const [fieldName, allowedRoles] of Object.entries(ALL_EDITABLE_FIELDS)) {
    if (allowedRoles.includes(userRole as Role)) {
      editableFields.push(fieldName)
    }
  }
  
  return editableFields
}

/**
 * Check if a user can perform priority reordering (drag-drop)
 * 
 * @param userRole - User's role from session
 * @returns true if user can reorder priorities, false otherwise
 */
export function canReorderPriorities(userRole: string): boolean {
  return userRole === 'ADMIN' || userRole === 'MANAGER'
}

/**
 * Check if a user can delete entries from scheduling table
 * 
 * @param userRole - User's role from session
 * @returns true if user can delete entries, false otherwise
 */
export function canDeleteEntries(userRole: string): boolean {
  return userRole === 'ADMIN' || userRole === 'MANAGER'
}

/**
 * Get human-readable field names in Chinese
 */
export const FIELD_NAMES: Record<keyof typeof ALL_EDITABLE_FIELDS, string> = {
  // Sync fields
  processIssues: '製程問題',
  qualityNotes: '品質備註',
  customerName: '客戶名稱',
  workDescription: '工作描述',
  productionQuantity: '生產數量',
  expectedProductionMaterialsDate: '預計物料到齊日期',
  productionMaterialsReady: '生產物料已齊',
  personInChargeId: '負責人',
  workType: '工作類型',
  
  // Priority fields
  priority: '優先級',
  expectedProductionStartDate: '預計開產時間'
}

/**
 * Get field category for display purposes
 */
export function getFieldCategory(fieldName: keyof typeof ALL_EDITABLE_FIELDS): 'sync' | 'priority' | 'general' {
  if (fieldName in FIELD_PERMISSIONS.SYNC_FIELDS) return 'sync'
  if (fieldName in FIELD_PERMISSIONS.PRIORITY_FIELDS) return 'priority'
  if (fieldName in FIELD_PERMISSIONS.GENERAL_FIELDS) return 'general'
  return 'general' // fallback
}

/**
 * Validate field permissions for a batch update
 * 
 * @param userRole - User's role from session
 * @param fields - Object with field names as keys
 * @returns Object with validation results for each field
 */
export function validateFieldPermissions(
  userRole: string,
  fields: Record<string, any>
): { valid: boolean; errors: string[]; allowedFields: string[] } {
  const errors: string[] = []
  const allowedFields: string[] = []
  
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value !== undefined) { // Only check fields that are being updated
      if (canEditField(userRole, fieldName as keyof typeof ALL_EDITABLE_FIELDS)) {
        allowedFields.push(fieldName)
      } else {
        errors.push(`無權限編輯欄位「${FIELD_NAMES[fieldName as keyof typeof ALL_EDITABLE_FIELDS] || fieldName}」`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    allowedFields
  }
}