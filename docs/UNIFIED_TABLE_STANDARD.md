# Unified Table Standard
**Easy Health Capsule Management System**  
**Version**: 1.0  
**Last Updated**: 2025-01-25  
**Status**: ✅ Production Standard

---

## Table of Contents
1. [Overview](#overview)
2. [Why This Standard Exists](#why-this-standard-exists)
3. [Quick Reference](#quick-reference)
4. [Component Usage](#component-usage)
5. [Color Standards](#color-standards)
6. [Dark Mode Requirements](#dark-mode-requirements)
7. [Accessibility](#accessibility)
8. [Examples](#examples)
9. [Migration Guide](#migration-guide)
10. [Testing Checklist](#testing-checklist)

---

## Overview

This document defines the unified standard for all table implementations in the Easy Health system. Following this standard ensures:
- ✅ **Consistent dark mode support** across all tables
- ✅ **Semantic color usage** that adapts automatically
- ✅ **Accessibility compliance** (WCAG AA)
- ✅ **Apple HIG animations** and interactions
- ✅ **Maintainability** through reusable components

---

## Why This Standard Exists

### **The Problem We Solved**

Before this standard (January 2025):
- ❌ Tables used hardcoded colors like `hover:bg-neutral-50` without dark mode
- ❌ Inconsistent hover effects (white flashes in dark mode)
- ❌ Mix of raw `<table>` elements and unified components
- ❌ Border colors too subtle (`border-neutral-100`)
- ❌ No systematic approach to table styling

### **User Impact**

User reported: _"When hover to the first row (title row), whole column becomes white, which is not dark mode friendly. Do you use unified design?"_

This led to a comprehensive audit and standardization of ALL tables in the system.

---

## Quick Reference

### **✅ DO: Use These Patterns**

```tsx
// 1. Headers
bg-surface-secondary/50

// 2. Row Hover
hover:bg-surface-secondary/30

// 3. Row Selected
bg-primary-50 dark:bg-primary-900/20

// 4. Borders
border-neutral-200 dark:border-neutral-700

// 5. Text
text-neutral-900 dark:text-white/95  // Primary
text-neutral-600 dark:text-white/75  // Secondary
```

### **❌ DON'T: Avoid These Patterns**

```tsx
// ❌ No dark mode variant
hover:bg-neutral-50
bg-neutral-100

// ❌ Hardcoded white
hover:bg-white/80

// ❌ Too subtle borders
border-neutral-100

// ❌ Inconsistent patterns
hover:bg-white/80 dark:hover:bg-elevation-1  // Works but inconsistent
```

---

## Component Usage

### **Option 1: Unified Table Components** (Recommended)

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Customer Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>ABC Company</TableCell>
      <TableCell>Active</TableCell>
      <TableCell>
        <Button size="sm">View</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Benefits:**
- ✅ Automatic dark mode support
- ✅ Consistent styling across app
- ✅ Built-in hover effects
- ✅ Semantic color usage
- ✅ Accessibility features

### **Option 2: Raw Table Elements** (When Necessary)

Only use raw `<table>` elements when you need:
- Custom table structure not supported by unified components
- Very complex tables with dynamic columns
- Legacy code that's difficult to migrate

**If using raw elements, ALWAYS follow this pattern:**

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-surface-secondary/50">
        <th className="px-4 py-3 text-left text-sm font-medium text-neutral-900 dark:text-white/95">
          Column Header
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-surface-secondary/30 dark:hover:bg-elevation-2 transition-colors">
        <td className="px-4 py-3 text-sm text-neutral-900 dark:text-white/95">
          Cell Content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Color Standards

### **Background Colors**

| Element | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| **Table Header** | `bg-surface-secondary/50` | Auto-adapts | Header row background |
| **Row Hover** | `hover:bg-surface-secondary/30` | Auto-adapts | Interactive row hover |
| **Row Selected** | `bg-primary-50` | `dark:bg-primary-900/20` | Selected/active row |
| **Row Even (optional)** | `bg-neutral-50/30` | `dark:bg-neutral-800/20` | Striped tables |

### **Text Colors**

| Content Type | Class | Usage |
|-------------|-------|-------|
| **Primary Text** | `text-neutral-900 dark:text-white/95` | Main cell content |
| **Secondary Text** | `text-neutral-600 dark:text-white/75` | Metadata, subtitles |
| **Tertiary Text** | `text-neutral-500 dark:text-white/65` | Hints, placeholders |
| **Header Text** | `text-neutral-900 dark:text-white/95` | Column headers |

### **Border Colors**

| Element | Class | Usage |
|---------|-------|-------|
| **Table Border** | `border-neutral-200 dark:border-neutral-700` | Outer table border |
| **Row Border** | `border-neutral-200 dark:border-neutral-700` | Between rows |
| **Cell Border** | `border-neutral-200 dark:border-neutral-700` | Between cells (if needed) |

---

## Dark Mode Requirements

### **Mandatory Dark Mode Support**

ALL tables MUST support dark mode. Every color class MUST have a `dark:` variant.

### **Testing Requirements**

**Test EVERY table in:**
1. ✅ Light mode (default)
2. ✅ Dark mode (toggle in UI)
3. ✅ Hover states in both modes
4. ✅ Selected states in both modes
5. ✅ Border visibility in both modes

### **Dark Mode Anti-Patterns**

```tsx
// ❌ WRONG - No dark mode
<tr className="hover:bg-neutral-50">

// ❌ WRONG - Hardcoded white
<tr className="hover:bg-white">

// ❌ WRONG - Opacity without consideration
<tr className="hover:bg-white/80">  // Will be white in dark mode!

// ✅ CORRECT - Semantic with auto dark mode
<tr className="hover:bg-surface-secondary/30">

// ✅ CORRECT - Explicit dark mode
<tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800">

// ✅ BEST - Use unified components (auto dark mode)
<TableRow>  // Built-in dark mode support
```

---

## Accessibility

### **WCAG AA Compliance**

All tables MUST meet WCAG AA standards:
- ✅ **Contrast Ratio**: Minimum 4.5:1 for text
- ✅ **Focus Indicators**: Visible on keyboard navigation
- ✅ **Screen Reader Support**: Proper ARIA attributes
- ✅ **Touch Targets**: Minimum 44x44px

### **Required ARIA Attributes**

```tsx
// Semantic HTML
<thead>  // Not <div>
<tbody>
<th scope="col">  // For column headers
<th scope="row">  // For row headers

// Sortable columns
<th aria-sort="ascending">  // or "descending" or "none"

// Interactive rows
<tr role="button" tabIndex={0} onClick={...}>

// Loading state
<div aria-live="polite">
  <span className="sr-only">{statusMessage}</span>
</div>
```

### **Keyboard Navigation**

```tsx
// Make rows keyboard-accessible
<tr
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
```

---

## Examples

### **Example 1: Simple Data Table**

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Customer</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {orders.map((order) => (
      <TableRow key={order.id}>
        <TableCell>{order.customerName}</TableCell>
        <TableCell>
          <Badge variant={order.status === 'active' ? 'success' : 'neutral'}>
            {order.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">{order.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### **Example 2: Sortable Table**

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>
        <button
          onClick={() => handleSort('customerName')}
          className="flex items-center gap-1 hover:text-primary-600 transition-colors"
          aria-sort={sortBy === 'customerName' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          Customer Name
          {getSortIcon('customerName')}
        </button>
      </TableHead>
    </TableRow>
  </TableHeader>
</Table>
```

### **Example 3: Interactive Rows**

```tsx
<TableBody>
  {items.map((item) => (
    <TableRow
      key={item.id}
      onClick={() => router.push(`/items/${item.id}`)}
      className="cursor-pointer"  // TableRow already has hover effect
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(`/items/${item.id}`)
      }}
    >
      <TableCell>{item.name}</TableCell>
    </TableRow>
  ))}
</TableBody>
```

### **Example 4: Selected State**

```tsx
<TableRow
  className={cn(
    selectedIds.includes(item.id) && "bg-primary-50 dark:bg-primary-900/20"
  )}
>
  <TableCell>
    <Checkbox
      checked={selectedIds.includes(item.id)}
      onCheckedChange={() => toggleSelection(item.id)}
    />
  </TableCell>
</TableRow>
```

### **Example 5: Loading State**

```tsx
<TableBody>
  {isLoading ? (
    <TableRow>
      <TableCell colSpan={3} className="text-center py-8">
        <LoadingSpinner />
        <p className="text-sm text-neutral-600 dark:text-white/75 mt-2">Loading...</p>
      </TableCell>
    </TableRow>
  ) : (
    items.map((item) => ...)
  )}
</TableBody>
```

### **Example 6: Empty State**

```tsx
<TableBody>
  {items.length === 0 ? (
    <TableRow>
      <TableCell colSpan={3} className="text-center py-8 text-neutral-500 dark:text-white/65">
        No items found
      </TableCell>
    </TableRow>
  ) : (
    items.map((item) => ...)
  )}
</TableBody>
```

---

## Migration Guide

### **Step 1: Identify Tables to Migrate**

Find all raw table implementations:
```bash
grep -r "<table\|<thead" src/components --include="*.tsx"
```

### **Step 2: Check Current Dark Mode Support**

```bash
grep -n "hover:bg-neutral-50\|hover:bg-white" src/components/your-file.tsx
```

### **Step 3: Choose Migration Strategy**

**Option A: Full Migration to Unified Components**
- Best for simple/medium complexity tables
- Automatic dark mode support
- Less code to maintain

**Option B: Fix Colors in Place**
- For complex tables difficult to migrate
- Still achieves dark mode support
- Keep existing structure

### **Step 4: Apply Fixes**

```tsx
// Before
<tr className="border-b border-neutral-100 hover:bg-neutral-50">

// After
<tr className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-surface-secondary/30 dark:hover:bg-elevation-2">
```

### **Step 5: Test**

- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Hover works in both modes
- [ ] No white flashes
- [ ] Borders visible
- [ ] Text readable

---

## Testing Checklist

### **Visual Testing**

- [ ] **Light Mode**
  - [ ] Header background visible
  - [ ] Row hover shows subtle gray
  - [ ] Borders visible
  - [ ] Text readable

- [ ] **Dark Mode**
  - [ ] Header background visible (not white)
  - [ ] Row hover shows subtle lighter shade (not white)
  - [ ] Borders visible
  - [ ] Text readable

- [ ] **Transitions**
  - [ ] Smooth 300ms transitions
  - [ ] No jarring color changes
  - [ ] Hover feels responsive

### **Accessibility Testing**

- [ ] **Keyboard Navigation**
  - [ ] Tab moves between interactive elements
  - [ ] Enter activates clickable rows
  - [ ] Focus indicator visible

- [ ] **Screen Reader**
  - [ ] Headers announced properly
  - [ ] Sort state announced
  - [ ] Loading state announced

- [ ] **Contrast**
  - [ ] Text meets 4.5:1 ratio (use browser dev tools)
  - [ ] Interactive elements distinguishable

### **Responsive Testing**

- [ ] **Mobile (320px-640px)**
  - [ ] Table scrolls horizontally
  - [ ] Touch targets large enough (44px+)
  - [ ] Text readable at small size

- [ ] **Tablet (640px-1024px)**
  - [ ] Table fits comfortably
  - [ ] Columns have appropriate width

- [ ] **Desktop (1024px+)**
  - [ ] Table uses available space well
  - [ ] No unnecessary wrapping

---

## Common Patterns

### **Pattern 1: Alternating Row Colors (Striped)**

```tsx
<TableBody>
  {items.map((item, index) => (
    <TableRow
      key={item.id}
      className={cn(
        index % 2 === 0 && "bg-neutral-50/30 dark:bg-neutral-800/20"
      )}
    >
      <TableCell>{item.name}</TableCell>
    </TableRow>
  ))}
</TableBody>
```

### **Pattern 2: Sticky Header**

```tsx
<TableHeader className="sticky top-0 bg-surface-primary dark:bg-elevation-0 z-10">
  <TableRow>
    <TableHead>Column</TableHead>
  </TableRow>
</TableHeader>
```

### **Pattern 3: Horizontal Scroll**

```tsx
<div className="overflow-x-auto">
  <Table>
    {/* Table with many columns */}
  </Table>
</div>
```

### **Pattern 4: Actions Column (Sticky Right)**

```tsx
<TableHead className="sticky right-0 bg-surface-secondary/50 backdrop-blur">
  Actions
</TableHead>

<TableCell className="sticky right-0 bg-surface-primary dark:bg-elevation-0 backdrop-blur">
  <Button size="sm">Edit</Button>
</TableCell>
```

---

## Performance Considerations

### **Large Tables (1000+ Rows)**

- ✅ Implement virtual scrolling (react-window or tanstack-virtual)
- ✅ Use pagination (30-100 rows per page)
- ✅ Lazy load data as user scrolls
- ✅ Optimize re-renders with React.memo

### **Complex Tables**

- ✅ Use `useCallback` for row click handlers
- ✅ Memoize sort/filter functions
- ✅ Avoid inline function definitions in map loops
- ✅ Use CSS for styling, not JS calculations

---

## Troubleshooting

### **Issue: White Flash on Hover in Dark Mode**

**Cause**: Using `hover:bg-neutral-50` or `hover:bg-white/80` without dark mode variant

**Fix**:
```tsx
// Change from:
hover:bg-neutral-50

// To:
hover:bg-surface-secondary/30
// Or:
hover:bg-neutral-50 dark:hover:bg-neutral-800
```

### **Issue: Borders Not Visible in Dark Mode**

**Cause**: Using `border-neutral-100` or similar light color

**Fix**:
```tsx
// Change from:
border-neutral-100

// To:
border-neutral-200 dark:border-neutral-700
```

### **Issue: Text Not Readable in Dark Mode**

**Cause**: Text color doesn't have dark mode variant

**Fix**:
```tsx
// Change from:
text-neutral-900

// To:
text-neutral-900 dark:text-white/95
```

---

## Related Documentation

- **Design System**: `docs/DESIGN_SYSTEM.md`
- **Dark Mode Guide**: `docs/DARK_MODE_V1_DOCUMENTATION.md`
- **Audit Report**: `docs/reports/TABLE_DARK_MODE_AUDIT.md`
- **Component Library**: `src/components/ui/table.tsx`

---

## Changelog

### **v1.0 - 2025-01-25**
- Initial standard created
- Based on comprehensive 15-file audit
- Fixed 5 tables with dark mode issues
- Achieved 100% dark mode compliance
- Established semantic color patterns

---

## Questions or Issues?

If you encounter a table pattern not covered in this guide:
1. Check existing tables for similar patterns
2. Refer to the audit report for edge cases
3. Follow the semantic color principles
4. Test in both light and dark modes
5. Document your solution for future reference

---

**Standard Status**: ✅ Active  
**Compliance**: Mandatory for all new tables  
**Last Audit**: 2025-01-25 (100% coverage)


