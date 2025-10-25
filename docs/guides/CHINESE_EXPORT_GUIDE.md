# Chinese Character Export Guide

## 🚨 CRITICAL: All Export Functions MUST Handle Chinese Characters Properly

This guide ensures that ALL export functions in the Easy Health system properly display Chinese characters in Excel, browsers, and other applications.

## 📋 Quick Checklist for New Export Functions

### ✅ MANDATORY Requirements

- [ ] **CSV Exports**: Use `exportToCSV()` from `@/lib/export/export-utils`
- [ ] **XLSX Exports**: Use `exportToXLSX()` from `@/lib/export/export-utils`
- [ ] **HTML Exports**: Use `exportToHTML()` from `@/lib/export/export-utils`
- [ ] **UTF-8 BOM**: Automatically added by utility functions
- [ ] **Content-Type**: Use `getMimeType()` for proper headers
- [ ] **Filename**: Use `createExportFilename()` for consistent naming
- [ ] **Validation**: Use `validateChineseData()` to check data

### ❌ NEVER Do This

```typescript
// ❌ WRONG - Manual CSV generation without BOM
const csvContent = rows.map(row => row.join(',')).join('\n')
return new Response(csvContent, { headers: { 'Content-Type': 'text/csv' } })

// ❌ WRONG - Manual XLSX without Chinese encoding
const workbook = XLSX.utils.book_new()
// ... missing Chinese character preparation

// ❌ WRONG - Hardcoded headers without proper encoding
headers: { 'Content-Type': 'text/csv' } // Missing charset=utf-8
```

### ✅ ALWAYS Do This

```typescript
// ✅ CORRECT - Use standardized utilities
import { exportToCSV, exportToXLSX, STANDARD_EXPORT_HEADERS } from '@/lib/export/export-utils'

// CSV Export
const { content, headers } = exportToCSV(data, 'work-orders')
return new NextResponse(content, {
  headers: { ...headers, ...STANDARD_EXPORT_HEADERS }
})

// XLSX Export
const buffer = exportToXLSX(data, 'work-orders', '工作單')
return new NextResponse(buffer, {
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="work-orders.xlsx"',
    ...STANDARD_EXPORT_HEADERS
  }
})
```

## 🔧 Implementation Examples

### 1. CSV Export API Route

```typescript
// src/app/api/your-feature/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exportToCSV, STANDARD_EXPORT_HEADERS, validateChineseData } from '@/lib/export/export-utils'

export async function POST(request: NextRequest) {
  try {
    // Fetch your data
    const data = await fetchYourData()
    
    // Validate Chinese character handling
    const validation = validateChineseData(data)
    if (validation.warnings.length > 0) {
      console.warn('Chinese character warnings:', validation.warnings)
    }
    
    // Export with proper Chinese support
    const { content, headers } = exportToCSV(data, 'your-feature')
    
    return new NextResponse(content, {
      headers: { ...headers, ...STANDARD_EXPORT_HEADERS }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
```

### 2. XLSX Export API Route

```typescript
// src/app/api/your-feature/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exportToXLSX, STANDARD_EXPORT_HEADERS } from '@/lib/export/export-utils'

export async function POST(request: NextRequest) {
  try {
    // Fetch your data
    const data = await fetchYourData()
    
    // Export with proper Chinese support
    const buffer = exportToXLSX(data, 'your-feature', '工作表')
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="your-feature.xlsx"',
        ...STANDARD_EXPORT_HEADERS
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
```

### 3. HTML Export (for PDF generation)

```typescript
// src/app/api/your-feature/export-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exportToHTML, STANDARD_EXPORT_HEADERS } from '@/lib/export/export-utils'

export async function POST(request: NextRequest) {
  try {
    // Generate HTML with Chinese content
    const html = generateHTMLWithChineseContent()
    
    // Export with proper Chinese support
    const { content, headers } = exportToHTML(html, 'your-feature')
    
    return new NextResponse(content, {
      headers: { ...headers, ...STANDARD_EXPORT_HEADERS }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
```

## 🧪 Testing Chinese Character Exports

### Test Checklist

1. **CSV Export Test**:
   - [ ] Open exported CSV in Excel
   - [ ] Verify Chinese characters display correctly (not as gibberish)
   - [ ] Check that UTF-8 BOM is present (file should start with invisible character)

2. **XLSX Export Test**:
   - [ ] Open exported XLSX in Excel
   - [ ] Verify Chinese characters display correctly
   - [ ] Check column widths are appropriate for Chinese text

3. **HTML Export Test**:
   - [ ] Open exported HTML in browser
   - [ ] Verify Chinese characters display correctly
   - [ ] Check that charset=utf-8 is in meta tag

### Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| CSV shows gibberish in Excel | 中文 becomes ä¸­æ–‡ | Add UTF-8 BOM using `addUTF8BOM()` |
| XLSX shows question marks | 中文 becomes ??? | Use `prepareChineseForExcel()` |
| HTML shows mojibake | 中文 becomes æ­£æ–‡ | Ensure `<meta charset="utf-8">` |
| Browser downloads as .txt | File extension wrong | Use proper `Content-Disposition` header |

## 📚 Reference Documentation

### Utility Functions

- `exportToCSV(data, filename)` - Standard CSV export with UTF-8 BOM
- `exportToXLSX(data, filename, sheetName)` - Standard XLSX export with Chinese support
- `exportToHTML(html, filename)` - Standard HTML export with UTF-8 charset
- `validateChineseData(data)` - Validate Chinese character handling
- `createExportFilename(prefix, format)` - Generate standardized filenames
- `getMimeType(format)` - Get proper MIME type for format

### Configuration Constants

- `STANDARD_CSV_CONFIG` - PapaParse configuration for CSV generation
- `STANDARD_XLSX_CONFIG` - XLSX writing options
- `STANDARD_EXPORT_HEADERS` - Standard response headers

## 🚀 Migration Guide for Existing Exports

### Step 1: Identify Export Functions

```bash
# Find all export functions
grep -r "Content-Type.*csv\|Content-Type.*xlsx" src/app/api/
grep -r "export.*csv\|export.*xlsx" src/
```

### Step 2: Update to Use Utilities

```typescript
// Before (manual implementation)
const csvContent = '\uFEFF' + Papa.unparse(data, { header: true })
return new Response(csvContent, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })

// After (using utilities)
import { exportToCSV, STANDARD_EXPORT_HEADERS } from '@/lib/export/export-utils'
const { content, headers } = exportToCSV(data, 'filename')
return new NextResponse(content, { headers: { ...headers, ...STANDARD_EXPORT_HEADERS } })
```

### Step 3: Test All Exports

1. Test each export function
2. Verify Chinese characters display correctly
3. Check file downloads work properly
4. Validate Excel compatibility

## 🔍 Debugging Chinese Character Issues

### Debug Steps

1. **Check UTF-8 BOM**:
   ```bash
   # Check if file starts with UTF-8 BOM
   hexdump -C exported-file.csv | head -1
   # Should show: 00000000  ef bb bf  ...
   ```

2. **Check Content-Type Headers**:
   ```typescript
   // Ensure charset=utf-8 is included
   'Content-Type': 'text/csv; charset=utf-8'
   ```

3. **Validate Data Preparation**:
   ```typescript
   // Use validation function
   const validation = validateChineseData(data)
   console.log('Chinese character warnings:', validation.warnings)
   ```

## 📝 Code Review Checklist

When reviewing export-related code, ensure:

- [ ] Uses standardized export utilities (`exportToCSV`, `exportToXLSX`, etc.)
- [ ] Includes UTF-8 BOM for CSV exports
- [ ] Uses proper Content-Type headers with charset=utf-8
- [ ] Includes `STANDARD_EXPORT_HEADERS`
- [ ] Uses `createExportFilename()` for consistent naming
- [ ] Validates Chinese character handling with `validateChineseData()`
- [ ] Tests with actual Chinese data
- [ ] Documents any special requirements

## 🎯 Future-Proofing

### For New Export Features

1. **Always use the standardized utilities** - Never implement manual CSV/XLSX generation
2. **Follow the examples** - Copy the implementation patterns from this guide
3. **Test with Chinese data** - Always test with actual Chinese characters
4. **Document special cases** - If you need custom handling, document why

### For Existing Features

1. **Audit current exports** - Check all existing export functions
2. **Migrate gradually** - Update one export at a time
3. **Test thoroughly** - Verify each migration works correctly
4. **Update documentation** - Keep this guide current

---

## 🚨 Remember: Chinese Character Support is NOT Optional

Every export function in the Easy Health system MUST properly handle Chinese characters. This is critical for the Hong Kong market and user experience.

**Use the standardized utilities. Follow the examples. Test with Chinese data.**
