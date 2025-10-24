/**
 * Work Order Authentication & Authorization Middleware
 * 
 * Defines RBAC (Role-Based Access Control) rules for work order operations.
 * Used across all work order API routes to enforce permissions.
 */

import { Role } from '@prisma/client'

/**
 * Permission matrix for work order operations
 * 
 * - ADMIN: Full access to all operations
 * - MANAGER: Can create, read, update, bulk update, import, export (cannot delete)
 * - EMPLOYEE: Can create, read, export only
 */
export const WORK_ORDER_PERMISSIONS = {
  CREATE: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
  READ: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
  UPDATE: ['ADMIN', 'MANAGER'] as Role[],
  DELETE: ['ADMIN'] as Role[],
  BULK_UPDATE: ['ADMIN', 'MANAGER'] as Role[],
  IMPORT: ['ADMIN', 'MANAGER'] as Role[],
  EXPORT: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[]
} as const

/**
 * Check if a user role has permission for a specific action
 * 
 * @param userRole - User's role from session
 * @param action - Action to check permission for
 * @returns true if user has permission, false otherwise
 * 
 * @example
 * ```typescript
 * if (!hasPermission(session.user.role, 'DELETE')) {
 *   return NextResponse.json({ success: false, error: '權限不足' }, { status: 403 })
 * }
 * ```
 */
export function hasPermission(
  userRole: string,
  action: keyof typeof WORK_ORDER_PERMISSIONS
): boolean {
  return WORK_ORDER_PERMISSIONS[action].includes(userRole as Role)
}

/**
 * Get human-readable permission name in Chinese
 */
export const PERMISSION_NAMES: Record<keyof typeof WORK_ORDER_PERMISSIONS, string> = {
  CREATE: '建立工作單',
  READ: '查看工作單',
  UPDATE: '編輯工作單',
  DELETE: '刪除工作單',
  BULK_UPDATE: '批量更新工作單',
  IMPORT: '匯入工作單',
  EXPORT: '匯出工作單'
}

/**
 * Get role display name in Chinese
 */
export const ROLE_NAMES: Record<Role, string> = {
  [Role.ADMIN]: '管理員',
  [Role.MANAGER]: '經理',
  [Role.EMPLOYEE]: '員工'
}

