/**
 * Manager Scheduling Table Authentication & Authorization Middleware
 * 
 * Defines RBAC (Role-Based Access Control) rules for scheduling table operations.
 * Used across all scheduling table API routes to enforce permissions.
 */

import { Role } from '@prisma/client'

/**
 * Permission matrix for scheduling table operations
 * 
 * - ADMIN: Full access to all operations
 * - MANAGER: Can create, read, update, delete (full management access)
 * - EMPLOYEE: Can view only (read-only access)
 */
export const SCHEDULING_PERMISSIONS = {
  VIEW: ['ADMIN', 'MANAGER', 'EMPLOYEE'] as Role[],
  CREATE: ['ADMIN', 'MANAGER'] as Role[],
  UPDATE: ['ADMIN', 'MANAGER'] as Role[],
  DELETE: ['ADMIN', 'MANAGER'] as Role[],
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
 * if (!hasPermission(session.user.role, 'UPDATE')) {
 *   return NextResponse.json({ success: false, error: '權限不足' }, { status: 403 })
 * }
 * ```
 */
export function hasPermission(
  userRole: string,
  action: keyof typeof SCHEDULING_PERMISSIONS
): boolean {
  return SCHEDULING_PERMISSIONS[action].includes(userRole as Role)
}

/**
 * Get human-readable permission name in Chinese
 */
export const PERMISSION_NAMES: Record<keyof typeof SCHEDULING_PERMISSIONS, string> = {
  VIEW: '查看排單表',
  CREATE: '新增到排單表',
  UPDATE: '編輯排單表',
  DELETE: '從排單表移除',
  EXPORT: '匯出排單表'
}

/**
 * Get role display name in Chinese
 */
export const ROLE_NAMES: Record<Role, string> = {
  [Role.ADMIN]: '管理員',
  [Role.MANAGER]: '經理',
  [Role.EMPLOYEE]: '員工'
}

