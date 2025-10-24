# Work Order System - Complete Implementation Plan

**Version**: 2.0 (Improved)  
**Date**: 2025-01-25  
**Status**: Ready for Implementation

---

## Executive Summary

This plan implements a comprehensive work order management system for Easy Health, replacing the current capsule-only system with a unified parent-child architecture that supports all business operations (包裝, 生產, 生產+包裝, 倉務).

### Key Improvements Over Original Plan

✅ **Chinese Encoding**: UTF-8 BOM for CSV, SheetJS with cpexcel.full.mjs for XLSX  
✅ **Status Workflow**: Full state machine with transition validation  
✅ **User Safety**: RESTRICT/SET NULL on delete strategies  
✅ **Smart Import**: Fuzzy matching + manual override + transaction rollback  
✅ **Performance**: Server pagination + virtual scrolling + composite indexes  
✅ **Bulk Operations**: Multi-select + bulk edit + undo tracking  
✅ **Advanced Filtering**: Multi-select filters + saved presets  
✅ **Mobile UX**: Card layout + swipe actions + 44px touch targets  
✅ **Data Migration**: Complex mapping with backup/rollback  
✅ **Validation**: Multi-level (BLOCKING/WARNING/INFO) with preview  

---

## Critical Issues Resolved

### 1. Chinese Encoding in CSV/Excel Exports

**Problem**: CSV exports with Chinese characters display as gibberish (`ä¸­æ–‡`) when opened in Excel.

**Root Cause**: Excel expects UTF-8 BOM (`\uFEFF`) to recognize Chinese characters in CSV files.

**Solution**:
- **CSV exports**: Add UTF-8 BOM at file start
- **XLSX exports**: Use SheetJS with `cpexcel.full.mjs` (handles Chinese natively)
- **Both options**: Let users choose format

**Implementation**:
```typescript
// src/lib/export/encoding-utils.ts
export function addUTF8BOM(str: string): string {
  return '\uFEFF' + str  // UTF-8 BOM
}

// CSV Export
const csv = Papa.unparse(data, {
  quotes: true,      // Quote all fields (safer for Chinese)
  header: true,
  newline: '\r\n',   // Windows line endings
  encoding: 'UTF-8'
})
const csvWithBOM = addUTF8BOM(csv)
const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })

// XLSX Export
import * as XLSX from 'xlsx'
import cpexcel from 'xlsx/dist/cpexcel.full.mjs'
XLSX.set_cptable(cpexcel)  // Enable Chinese character support

const wb = XLSX.utils.book_new()
const ws = XLSX.utils.json_to_sheet(data)
XLSX.utils.book_append_sheet(wb, ws, '工作單')
const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
```

### 2. Missing Status Management Workflow

**Problem**: Original plan didn't model workflow state machine visible in spreadsheet (標記 → 資料齊全 → 已通知 → 已收數 → 已出貨).

**Solution**: Add WorkOrderStatus enum with transition validation.

```prisma
enum WorkOrderStatus {
  DRAFT          // 草稿
  PENDING        // 待處理
  DATA_COMPLETE  // 資料齊全
  NOTIFIED       // 已通知
  PAID           // 已收數
  SHIPPED        // 已出貨
  COMPLETED      // 已完成
  ON_HOLD        // 暫停
  CANCELLED      // 已取消
}

model WorkOrder {
  status             WorkOrderStatus @default(PENDING)
  statusUpdatedAt    DateTime?
  statusUpdatedBy    String?
  
  // Auto-update status when dates are filled
  dataCompleteDate   DateTime?  // Sets status to DATA_COMPLETE
  notifiedDate       DateTime?  // Sets status to NOTIFIED
  paymentReceivedDate DateTime? // Sets status to PAID
  shippedDate        DateTime?  // Sets status to SHIPPED
}
```

**Transition Validation**:
```typescript
const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['DATA_COMPLETE', 'ON_HOLD', 'CANCELLED'],
  DATA_COMPLETE: ['NOTIFIED', 'ON_HOLD', 'CANCELLED'],
  NOTIFIED: ['PAID', 'ON_HOLD', 'CANCELLED'],
  PAID: ['SHIPPED', 'ON_HOLD', 'CANCELLED'],
  SHIPPED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  ON_HOLD: ['PENDING', 'CANCELLED'],
  CANCELLED: []
}

function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}
```

### 3. User Deletion Safety

**Problem**: Original plan didn't specify what happens when deleting a user assigned to work orders.

**Solution**: Different strategies for different fields.

```prisma
model WorkOrder {
  personInChargeId  String
  personInCharge    User @relation("WorkOrderPersonInCharge", 
                         fields: [personInChargeId], 
                         references: [id], 
                         onDelete: RESTRICT)  // ✅ Can't delete if has orders
}

model CapsulationOrder {
  customerServiceId String?
  customerService   User? @relation("CapsulationOrderCustomerService", 
                          fields: [customerServiceId], 
                          references: [id], 
                          onDelete: SET NULL)  // ✅ OK to clear
}
```

**Before deleting user**:
```typescript
async function canDeleteUser(userId: string): Promise<boolean> {
  const orderCount = await prisma.workOrder.count({
    where: { personInChargeId: userId }
  })
  return orderCount === 0
}

// UI shows: "無法刪除：此用戶負責 15 個工作單。請先重新分配這些工作單。"
```

### 4. Import User Name Mapping

**Problem**: Spreadsheet has user names ("King", "Alex"), but database needs User IDs.

**Solution**: Multi-step fuzzy matching algorithm.

```typescript
// Step 1: Exact match (case-insensitive, trimmed)
const exactMatch = users.find(u => 
  u.nickname?.toLowerCase().trim() === name.toLowerCase().trim()
)

// Step 2: Fuzzy match (similarity > 0.7)
const fuzzyMatches = users.filter(u => {
  const similarity = levenshtein(
    normalize(name),
    normalize(u.nickname || '')
  )
  return similarity > 0.7
})

// Step 3: Manual selection UI for ambiguous cases
if (fuzzyMatches.length > 1) {
  // Show dropdown: "King" matches 2 users:
  // - 👤 King Wong (+852 6624 4432)
  // - 👤 King Li (+852 5555 1234)
  // Select correct user →
}

// Step 4: Create new user option
if (fuzzyMatches.length === 0) {
  // Show: "未找到用戶 'King'
  // [創建新用戶] [跳過此筆]
}
```

### 5. Smart Table Performance

**Problem**: With 300+ work orders and 20+ fields, naive rendering = slow.

**Solutions**:

**A. Server-Side Pagination**
```typescript
// API returns only 25 records at a time
GET /api/work-orders?page=1&limit=25&sortBy=createdAt&sortOrder=desc
```

**B. Virtual Scrolling** (if showing 100+)
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: workOrders.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,  // Row height
  overscan: 5
})
```

**C. Composite Database Indexes**
```prisma
@@index([customerName, workType])  // Common filter combo
@@index([status, expectedCompletionDate])  // Dashboard queries
@@index([createdAt(sort: Desc)])  // Recent orders
```

**D. Debounced Search**
```typescript
const debouncedSearch = useDeb once((value: string) => {
  fetchOrders({ search: value })
}, 300)  // Wait 300ms after user stops typing
```

### 6. Import Validation & Rollback

**Problem**: Import 1000 rows, error at row 500 → what happens?

**Solution**: Transaction with rollback.

```typescript
// Validate ALL rows before import
const validation = validateAllRows(rows)
if (validation.errors > 0) {
  return { error: `${validation.errors} 筆資料有錯誤，請修正後重試` }
}

// Import in transaction
const imported: string[] = []
try {
  await prisma.$transaction(async (tx) => {
    for (const row of validRows) {
      const order = await tx.workOrder.create({ data: row })
      imported.push(order.id)
    }
  })
  // Success: all or nothing
} catch (error) {
  // Rollback: nothing was imported
  return { error: '匯入失敗，所有資料已回滾' }
}
```

**Validation Levels**:
```typescript
enum ValidationLevel {
  BLOCKING,  // ❌ Skip row (missing required field)
  WARNING,   // ⚠️ Import with warning (missing optional field)
  INFO       // ℹ️ Import with note (auto-corrected value)
}
```

### 7. Bulk Operations

**Problem**: Need to change person in charge for 50 orders → tedious one-by-one.

**Solution**: Multi-select + bulk actions.

```typescript
// UI Components
<BulkSelectCheckbox />  // Select all visible
<BulkActionDropdown>
  <option>更改負責人</option>
  <option>更改狀態</option>
  <option>批量刪除</option>
  <option>匯出已選</option>
</BulkActionDropdown>

// API Endpoint
POST /api/work-orders/bulk-update
Body: {
  workOrderIds: ['id1', 'id2', ...],
  updates: {
    personInChargeId: 'newUserId',
    statusUpdatedBy: 'currentUserId'
  }
}

// Implementation
await prisma.workOrder.updateMany({
  where: { id: { in: workOrderIds } },
  data: updates
})

// Audit log
await logAudit({
  action: AuditAction.WORK_ORDER_BULK_UPDATED,
  metadata: {
    count: workOrderIds.length,
    updates: Object.keys(updates)
  }
})
```

### 8. Advanced Filtering

**Problem**: Users need to find "King's PRODUCTION orders from December that are PAID".

**Solution**: Multi-select filters with AND logic.

```typescript
// Filter UI
<FilterToolbar>
  <MultiSelect
    label="負責人"
    options={users}
    value={filters.personInCharge}
    onChange={handlePersonChange}
  />
  <MultiSelect
    label="工作類型"
    options={WORK_TYPES}
    value={filters.workType}
  />
  <MultiSelect
    label="狀態"
    options={STATUSES}
    value={filters.status}
  />
  <DateRangePicker
    label="日期範圍"
    value={filters.dateRange}
  />
  <SavedFiltersDropdown>
    <option>我的工作單</option>
    <option>逾期未完成</option>
    <option>本週到期</option>
  </SavedFiltersDropdown>
</FilterToolbar>

// API Query Building
const where: Prisma.WorkOrderWhereInput = {
  AND: [
    filters.personInCharge ? { personInChargeId: { in: filters.personInCharge } } : {},
    filters.workType ? { workType: { in: filters.workType } } : {},
    filters.status ? { status: { in: filters.status } } : {},
    filters.dateRange ? {
      expectedCompletionDate: {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to
      }
    } : {}
  ]
}
```

### 9. Data Migration Complexity

**Problem**: Current ProductionOrder doesn't have many WorkOrder fields.

**Solution**: Intelligent mapping + manual review.

```typescript
// scripts/migrate-to-work-orders.ts

async function migrateProductionOrders() {
  const orders = await prisma.productionOrder.findMany({
    include: { ingredients: true, worklogs: true }
  })
  
  const defaultAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  for (const oldOrder of orders) {
    // Generate JOB number from order details
    const jobNumber = generateJobNumber(oldOrder)
    
    // Infer status from completion date
    const status = oldOrder.completionDate 
      ? WorkOrderStatus.COMPLETED 
      : WorkOrderStatus.PENDING
    
    // Create new WorkOrder + CapsulationOrder
    await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.create({
        data: {
          jobNumber,
          customerName: oldOrder.customerName,
          personInChargeId: defaultAdmin.id,  // Default to admin
          workType: WorkType.PRODUCTION,
          status,
          workDescription: `膠囊生產：${oldOrder.productName}`,
          expectedCompletionDate: oldOrder.completionDate,
          createdAt: oldOrder.createdAt,
          updatedAt: oldOrder.updatedAt
        }
      })
      
      const capsulation = await tx.capsulationOrder.create({
        data: {
          workOrderId: workOrder.id,
          productName: oldOrder.productName,
          productionQuantity: oldOrder.productionQuantity,
          unitWeightMg: oldOrder.unitWeightMg,
          batchTotalWeightMg: oldOrder.batchTotalWeightMg,
          completionDate: oldOrder.completionDate,
          capsuleColor: oldOrder.capsuleColor,
          capsuleSize: oldOrder.capsuleSize,
          capsuleType: oldOrder.capsuleType,
          // ... all other fields
          createdAt: oldOrder.createdAt,
          updatedAt: oldOrder.updatedAt
        }
      })
      
      // Migrate ingredients
      await tx.ingredient.updateMany({
        where: { orderId: oldOrder.id },
        data: { orderId: capsulation.id }
      })
      
      // Migrate worklogs
      await tx.orderWorklog.updateMany({
        where: { orderId: oldOrder.id },
        data: { orderId: capsulation.id }
      })
    })
  }
  
  console.log(`✅ Migrated ${orders.length} orders`)
}

function generateJobNumber(order: ProductionOrder): string {
  const date = order.createdAt.toISOString().slice(0,10).replace(/-/g, '')
  const customer = order.customerName.slice(0, 10)
  const product = order.productName.slice(0, 15)
  return `JOB ${date}${customer}·${product}`
}
```

### 10. Mobile/Tablet Experience

**Problem**: 20+ columns don't fit on mobile, need thoughtful design.

**Solution**: Responsive card layout.

**Desktop (≥1280px)**: Full table + expandable rows
```tsx
<Table>
  <TableRow>
    <Cell sticky>JOB-20240424...</Cell>
    <Cell>HerbGever</Cell>
    <Cell><UserBadge userId="..." /></Cell>
    <Cell><Badge variant="production">生產</Badge></Cell>
    <Cell>2024-05-24</Cell>
    <Cell><StatusDots status="PAID" /></Cell>
    <Cell><ActionsDropdown /></Cell>
  </TableRow>
  <ExpandableRow>
    {/* Timeline, dates, quantities, linked orders */}
  </ExpandableRow>
</Table>
```

**Tablet (768-1279px)**: 5 columns + card expansion
```tsx
<Table>
  <TableRow onClick={expand}>
    <Cell>JOB-20240424...</Cell>
    <Cell>HerbGever</Cell>
    <Cell><UserBadge /></Cell>
    <Cell><Badge>生產</Badge></Cell>
    <Cell><StatusDots /></Cell>
  </TableRow>
</Table>
<SlideUpPanel show={expanded}>
  {/* Full details */}
</SlideUpPanel>
```

**Mobile (<768px)**: Vertical cards
```tsx
<Card swipeable onSwipeRight={markComplete} onSwipeLeft={delete}>
  <CardHeader>
    <JobNumber>JOB-20240424...</JobNumber>
    <StatusBadge status="PAID" />
  </CardHeader>
  <CardBody>
    <Row>
      <Label>客戶</Label>
      <Value>HerbGever</Value>
    </Row>
    <Row>
      <Label>負責人</Label>
      <Value><UserBadge /></Value>
    </Row>
    <Row>
      <Label>預計完成</Label>
      <Value>2024-05-24</Value>
    </Row>
  </CardBody>
  <CardActions>
    <IconButton size="lg">編輯</IconButton>
    <IconButton size="lg">查看</IconButton>
  </CardActions>
</Card>

// Touch targets: 44x44px minimum (Apple HIG)
```

---

## Implementation Plan

### Phase 1: Database Schema & Migration

**Files to modify**:
- `prisma/schema.prisma`

**Tasks**:
1. Create `WorkOrderStatus` and `WorkType` enums
2. Create `WorkOrder` model with all spreadsheet fields
3. Rename `ProductionOrder` to `CapsulationOrder`
4. Add `workOrderId` foreign key to `CapsulationOrder`
5. Update `User` model with relations
6. Add `onDelete: RESTRICT` for `personInChargeId`
7. Add `onDelete: SET NULL` for `customerServiceId`
8. Add composite indexes for performance
9. Run migration: `npx prisma migrate dev --name add_work_order_system`

### Phase 2: TypeScript Types

**Files to create/modify**:
- `src/types/work-order.ts` (new)
- `src/types/index.ts` (update exports)

**Types to define**:
```typescript
export type WorkOrderStatus = 'DRAFT' | 'PENDING' | 'DATA_COMPLETE' | ...
export type WorkType = 'PACKAGING' | 'PRODUCTION' | ...

export interface WorkOrder { /* ... */ }
export interface CapsulationOrder { /* ... */ }
export interface CreateWorkOrderData { /* ... */ }
export interface WorkOrderSearchFilters { /* ... */ }
export interface BulkUpdateData { /* ... */ }
export interface ImportData { /* ... */ }
export interface ValidationError { /* ... */ }
```

### Phase 3: Chinese-Safe Export Implementation

**Files to create**:
- `src/lib/export/encoding-utils.ts`
- `src/lib/export/work-order-exporter.ts`

**Install dependencies**:
```bash
npm install xlsx papaparse
npm install --save-dev @types/papaparse
```

**Key functions**:
- `addUTF8BOM(str: string): string`
- `exportToXLSX(orders, options): Blob`
- `exportToCSV(orders, options): Blob`

### Phase 4: Smart Import System

**Files to create**:
- `src/lib/import/file-parser.ts`
- `src/lib/import/column-mapper.ts`
- `src/lib/import/user-mapper.ts`
- `src/lib/import/validator.ts`
- `src/lib/import/work-order-importer.ts`

**Key functions**:
- `parseImportFile(file): ImportData`
- `autoMapColumns(headers): ColumnMapping`
- `mapUsersFromNames(names): UserMappingResult`
- `validateImportRow(row): ValidationError[]`
- `importWorkOrders(data): ImportResult`

### Phase 5: API Routes

**Files to create**:
- `src/app/api/work-orders/route.ts` (GET, POST)
- `src/app/api/work-orders/[id]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/work-orders/bulk-update/route.ts` (POST)
- `src/app/api/work-orders/import/parse/route.ts` (POST)
- `src/app/api/work-orders/import/execute/route.ts` (POST)
- `src/app/api/work-orders/export/route.ts` (POST)
- `src/app/api/users/list/route.ts` (GET - for dropdowns)

**Features**:
- Server-side pagination
- Multi-field filtering
- Sorting
- Audit logging
- Transaction support
- Error handling

### Phase 6: UI Components

**Files to create**:

**Forms**:
- `src/components/forms/UserSelect.tsx` - Searchable user dropdown with nickname
- `src/components/forms/WorkTypeSelect.tsx` - Work type selection
- `src/components/forms/StatusSelect.tsx` - Status selection

**Badges**:
- `src/components/ui/UserBadge.tsx` - Display user with avatar + nickname
- `src/components/ui/StatusBadge.tsx` - Visual status indicator
- `src/components/ui/WorkTypeBadge.tsx` - Color-coded work type

**Table Components**:
- `src/components/work-orders/WorkOrderTable.tsx` - Smart table with pagination
- `src/components/work-orders/WorkOrderRow.tsx` - Individual row
- `src/components/work-orders/ExpandableRow.tsx` - Expanded row details
- `src/components/work-orders/BulkSelectCheckbox.tsx` - Multi-select
- `src/components/work-orders/BulkActionDropdown.tsx` - Bulk operations
- `src/components/work-orders/ColumnVisibilityControl.tsx` - Show/hide columns

**Timeline**:
- `src/components/work-orders/WorkOrderTimeline.tsx` - Visual workflow progress

**Filters**:
- `src/components/work-orders/FilterToolbar.tsx` - Multi-select filters
- `src/components/work-orders/SavedFiltersDropdown.tsx` - Filter presets
- `src/components/work-orders/QuickFilters.tsx` - One-click filters

**Import**:
- `src/components/work-orders/import/FileUploadStep.tsx`
- `src/components/work-orders/import/ColumnMappingStep.tsx`
- `src/components/work-orders/import/UserMappingStep.tsx`
- `src/components/work-orders/import/PreviewStep.tsx`
- `src/components/work-orders/import/ProgressStep.tsx`
- `src/components/work-orders/import/SummaryStep.tsx`

**Export**:
- `src/components/work-orders/ExportDialog.tsx` - Format + column selection

**Form**:
- `src/components/work-orders/WorkOrderForm.tsx` - Create/edit form

### Phase 7: Pages

**Files to create**:
- `src/app/work-orders/page.tsx` - List page with smart table
- `src/app/work-orders/new/page.tsx` - Create page
- `src/app/work-orders/[id]/page.tsx` - Detail/edit page
- `src/app/work-orders/import/page.tsx` - Import wizard

**Features per page**:

**List Page (`/work-orders`)**:
- Smart table (7-8 columns)
- Server pagination
- Multi-select filters
- Bulk operations
- Quick filters
- Export button
- Column visibility control

**Create Page (`/work-orders/new`)**:
- Work type selection
- User selection (person in charge)
- Conditional capsulation fields
- Date pickers
- VIP checkboxes
- Validation with Zod

**Detail Page (`/work-orders/[id]`)**:
- Full information display
- Status timeline
- Edit mode
- Linked capsulation order (if any)
- Audit log
- Delete confirmation

**Import Page (`/work-orders/import`)**:
- 6-step wizard
- File upload
- Column mapping
- User mapping
- Preview + validation
- Progress tracking
- Summary report

### Phase 8: Validation Schemas

**File to modify**:
- `src/lib/validations.ts`

**Schemas to add**:
```typescript
export const workOrderSchema = z.object({
  jobNumber: z.string().min(1).max(100),
  customerName: z.string().min(1).max(200),
  personInChargeId: z.string().cuid(),
  workType: z.enum(['PACKAGING', 'PRODUCTION', 'PRODUCTION_PACKAGING', 'WAREHOUSING']),
  status: z.enum(['DRAFT', 'PENDING', ...]).default('PENDING'),
  expectedCompletionDate: z.date().optional(),
  workDescription: z.string().min(1),
  // ... more fields
})

export const capsulationOrderSchema = z.object({
  productName: z.string().min(1).max(200),
  productionQuantity: z.number().positive(),
  customerServiceId: z.string().cuid().optional(),
  ingredients: z.array(ingredientSchema).min(1),
  // ... more fields
})

export const bulkUpdateSchema = z.object({
  workOrderIds: z.array(z.string().cuid()).min(1),
  updates: z.object({
    personInChargeId: z.string().cuid().optional(),
    status: z.enum([...]).optional(),
    // ... updatable fields
  })
})

export const importRowSchema = z.object({
  // Flexible schema for import validation
})
```

### Phase 9: Data Migration Script

**File to create**:
- `scripts/migrate-to-work-orders.ts`

**Features**:
- Backup existing data
- Generate JOB numbers
- Infer status from completion date
- Default to admin user for person in charge
- Migrate ingredients and worklogs
- Transaction support
- Rollback on error
- Detailed log output

**Run**:
```bash
# Backup first
npm run db:backup

# Run migration
ts-node scripts/migrate-to-work-orders.ts

# Verify
npm run db:verify-migration
```

### Phase 10: Testing

**Test files to create**:
- `src/__tests__/work-orders/export-chinese.test.ts`
- `src/__tests__/work-orders/import-validation.test.ts`
- `src/__tests__/work-orders/user-mapping.test.ts`
- `src/__tests__/work-orders/bulk-operations.test.ts`
- `src/__tests__/work-orders/status-transitions.test.ts`

**Test cases**:
- Chinese character encoding in CSV/XLSX
- User name fuzzy matching
- Import validation (all levels)
- Bulk update transactions
- Status transition validation
- User deletion prevention
- Performance with 1000+ records

### Phase 11: Documentation

**Files to create/update**:
- `docs/WORK_ORDER_SYSTEM_GUIDE.md` - User guide
- `docs/IMPORT_EXPORT_GUIDE.md` - Import/export instructions
- `README.md` - Update with work order features

---

## Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` locally - must pass
- [ ] Run database migration in staging environment
- [ ] Test Chinese characters in CSV/XLSX exports
- [ ] Import sample spreadsheet (100+ rows) with Chinese
- [ ] Test user deletion with assigned work orders
- [ ] Test bulk operations with 50+ selected orders
- [ ] Test filtering with multiple criteria
- [ ] Test on mobile device (touch targets, card layout)
- [ ] Verify status transitions work correctly
- [ ] Test transaction rollback on import error
- [ ] Run data migration script on staging database
- [ ] Backup production database
- [ ] Deploy to production
- [ ] Monitor for errors in first 24 hours
- [ ] Gather user feedback
- [ ] Update documentation based on feedback

---

## Performance Benchmarks

Target metrics:

- **Table load time**: < 2 seconds (100 records)
- **Filter response**: < 500ms
- **Import 1000 rows**: < 30 seconds
- **Export 1000 rows**: < 10 seconds
- **Bulk update 50 orders**: < 3 seconds
- **Mobile card render**: < 100ms per card

---

## File Structure Summary

```
src/
├── app/
│   ├── api/
│   │   ├── work-orders/
│   │   │   ├── route.ts (GET, POST)
│   │   │   ├── [id]/route.ts (GET, PATCH, DELETE)
│   │   │   ├── bulk-update/route.ts
│   │   │   ├── import/
│   │   │   │   ├── parse/route.ts
│   │   │   │   └── execute/route.ts
│   │   │   └── export/route.ts
│   │   └── users/
│   │       └── list/route.ts
│   └── work-orders/
│       ├── page.tsx (list)
│       ├── new/page.tsx (create)
│       ├── [id]/page.tsx (detail)
│       └── import/page.tsx (import wizard)
├── components/
│   ├── forms/
│   │   ├── UserSelect.tsx
│   │   ├── WorkTypeSelect.tsx
│   │   └── StatusSelect.tsx
│   ├── ui/
│   │   ├── UserBadge.tsx
│   │   ├── StatusBadge.tsx
│   │   └── WorkTypeBadge.tsx
│   └── work-orders/
│       ├── WorkOrderTable.tsx
│       ├── WorkOrderRow.tsx
│       ├── ExpandableRow.tsx
│       ├── WorkOrderTimeline.tsx
│       ├── FilterToolbar.tsx
│       ├── BulkSelectCheckbox.tsx
│       ├── BulkActionDropdown.tsx
│       ├── ColumnVisibilityControl.tsx
│       ├── WorkOrderForm.tsx
│       ├── ExportDialog.tsx
│       └── import/
│           ├── FileUploadStep.tsx
│           ├── ColumnMappingStep.tsx
│           ├── UserMappingStep.tsx
│           ├── PreviewStep.tsx
│           ├── ProgressStep.tsx
│           └── SummaryStep.tsx
├── lib/
│   ├── export/
│   │   ├── encoding-utils.ts
│   │   └── work-order-exporter.ts
│   ├── import/
│   │   ├── file-parser.ts
│   │   ├── column-mapper.ts
│   │   ├── user-mapper.ts
│   │   ├── validator.ts
│   │   └── work-order-importer.ts
│   └── validations.ts (add schemas)
├── types/
│   ├── work-order.ts (new)
│   └── index.ts (update exports)
└── __tests__/
    └── work-orders/
        ├── export-chinese.test.ts
        ├── import-validation.test.ts
        ├── user-mapping.test.ts
        ├── bulk-operations.test.ts
        └── status-transitions.test.ts

scripts/
└── migrate-to-work-orders.ts

docs/
├── WORK_ORDER_SYSTEM_GUIDE.md
└── IMPORT_EXPORT_GUIDE.md
```

---

## Conclusion

This plan addresses all critical issues found in the original version:

✅ **Chinese encoding properly handled** with UTF-8 BOM and SheetJS  
✅ **Status workflow modeled** with transition validation  
✅ **User deletion safe** with RESTRICT/SET NULL strategies  
✅ **Import user mapping** with fuzzy matching and manual override  
✅ **Performance optimized** for 1000+ records  
✅ **Validation robust** with multi-level errors and rollback  
✅ **Bulk operations included** for efficiency  
✅ **Filtering advanced** with multi-select and saved presets  
✅ **Mobile experience thoughtful** with card layout and touch targets  
✅ **Data migration handled** with complex mapping logic  

The system is production-ready and scalable for future expansion to other work types (背封+泡罩, etc.).

---

**Next Steps**: Get user approval, then begin Phase 1 (Database Schema).

