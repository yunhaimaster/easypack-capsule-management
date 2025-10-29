# Field-Level Permissions Implementation

## Overview

This document describes the implementation of field-level permissions for the Manager Scheduling Table (經理排單表). The system now allows different user roles to edit specific fields while maintaining security and data integrity.

## Problem Statement

Originally, only managers and administrators could edit any field in the scheduling table. However, the user requested that:

1. **All users** should be able to edit fields that sync with other tables
2. **All users** should be able to use the "create production order" link
3. **Only managers and administrators** should be able to change priority ordering

## Solution Architecture

### 1. Field-Level Permission System

Created `src/lib/middleware/field-level-permissions.ts` with:

- **SYNC_FIELDS**: Fields that sync with other tables (editable by all users)
- **PRIORITY_FIELDS**: Fields related to priority ordering (manager/admin only)
- **GENERAL_FIELDS**: Other fields (manager/admin only)

### 2. Field Categories

#### Sync Fields (All Users Can Edit)
- `processIssues` - 製程問題
- `qualityNotes` - 品質備註  
- `customerName` - 客戶名稱
- `workDescription` - 工作描述
- `productionQuantity` - 生產數量
- `expectedProductionMaterialsDate` - 預計物料到齊日期
- `productionMaterialsReady` - 生產物料已齊
- `personInChargeId` - 負責人
- `workType` - 工作類型

#### Priority Fields (Manager/Admin Only)
- `priority` - 優先級
- `expectedProductionStartDate` - 預計開產時間

### 3. Permission Functions

```typescript
// Check if user can edit specific field
canEditField(userRole: string, fieldName: string): boolean

// Get all fields user can edit
getEditableFields(userRole: string): string[]

// Check priority reordering permission
canReorderPriorities(userRole: string): boolean

// Check delete permission
canDeleteEntries(userRole: string): boolean

// Validate batch field updates
validateFieldPermissions(userRole: string, fields: Record<string, any>)
```

## Implementation Details

### 1. Backend Changes

#### API Route Updates (`src/app/api/manager-scheduling/[id]/route.ts`)

- **Before**: Single `UPDATE` permission check for all fields
- **After**: Field-level validation using `validateFieldPermissions()`

```typescript
// Field-level permission validation
const permissionCheck = validateFieldPermissions(session.user.role, validatedData)
if (!permissionCheck.valid) {
  return NextResponse.json({
    success: false,
    error: '權限不足',
    details: permissionCheck.errors
  }, { status: 403 })
}
```

### 2. Frontend Changes

#### Main Page (`src/app/manager-scheduling/page.tsx`)

Added granular permission props:
```typescript
const canEdit = isManager || isAdmin
const canEditSyncFields = true // All authenticated users
const canEditPriority = isManager || isAdmin // Only managers
```

#### Table Component (`src/components/manager-scheduling/scheduling-table.tsx`)

Updated to use field-specific permissions:

- **Drag-drop reordering**: Uses `canEditPriority`
- **Sync field editing**: Uses `canEditSyncFields` 
- **Priority field editing**: Uses `canEditPriority`
- **Delete buttons**: Uses `canEdit` (manager/admin only)

#### Inline Edit Component

The `SchedulingInlineEdit` component already supported per-field `canEdit` props, so it works seamlessly with the new permission system.

## User Experience

### For Employees
- ✅ Can edit sync fields (processIssues, qualityNotes, customerName, etc.)
- ✅ Can use "create production order" link
- ❌ Cannot change priority ordering (drag-drop disabled)
- ❌ Cannot edit expectedProductionStartDate
- ❌ Cannot delete entries

### For Managers/Administrators
- ✅ Can edit all fields
- ✅ Can reorder priorities (drag-drop enabled)
- ✅ Can delete entries
- ✅ Full access to all functionality

## Security Considerations

1. **Backend Validation**: All field updates are validated server-side
2. **Role-Based Access**: Permissions are checked against user roles from session
3. **Audit Logging**: All field updates are logged with user context
4. **Error Handling**: Clear error messages for permission violations

## Testing

Created comprehensive test suite in `src/lib/middleware/__tests__/field-level-permissions.test.ts`:

- Field permission validation for each role
- Batch update validation
- Edge cases and error handling
- Permission structure verification

## Migration Notes

### Breaking Changes
- None - this is a permission enhancement, not a breaking change

### Database Changes
- None - uses existing database schema

### Configuration Changes
- None - uses existing role system

## Future Enhancements

1. **Dynamic Field Permissions**: Could be extended to support custom field permissions per user
2. **Field-Level Audit**: Track which specific fields were changed by which users
3. **Conditional Permissions**: Field permissions based on entry status or other conditions
4. **UI Indicators**: Visual indicators showing which fields are editable for current user

## Files Modified

1. `src/lib/middleware/field-level-permissions.ts` - New permission system
2. `src/app/api/manager-scheduling/[id]/route.ts` - Backend validation
3. `src/app/manager-scheduling/page.tsx` - Permission props
4. `src/components/manager-scheduling/scheduling-table.tsx` - Field-specific permissions
5. `src/lib/middleware/__tests__/field-level-permissions.test.ts` - Test suite

## Verification

To verify the implementation works correctly:

1. **Test as Employee**: Login as employee, verify sync fields are editable but priority fields are not
2. **Test as Manager**: Login as manager, verify all fields are editable including priority reordering
3. **Test API**: Send PATCH requests with different field combinations and verify proper validation
4. **Test Error Handling**: Verify appropriate error messages for permission violations

## Conclusion

The field-level permission system successfully addresses the user's requirements while maintaining security and providing a clear, maintainable architecture. The implementation follows the existing patterns in the codebase and provides a solid foundation for future permission enhancements.