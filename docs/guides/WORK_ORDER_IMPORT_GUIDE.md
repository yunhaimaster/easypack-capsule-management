# 📊 Work Order Import Guide

Complete guide for importing your 641-row Excel spreadsheet into the Easy Health system.

---

## ✅ **Good News: Your Excel is Already Compatible!**

The system now understands your exact Excel format, including:
- Combined quantity+unit formats (e.g., "480 瓶", "23,600粒", "60,000 sachets")
- Boolean values as TRUE/FALSE
- Chinese column headers
- Multi-line work descriptions

**No manual editing required!** Just upload your Excel file directly.

---

## 📋 **Column Mapping (Your Excel → Database)**

### **Your Excel Columns** (as seen in screenshot)

| Your Column Header | Maps To | Type | Notes |
|-------------------|---------|------|-------|
| 編碼/日期 | Created Date | Date | e.g., "2023年10月9日" |
| 客戶名稱 | Customer Name | Text | **Required** |
| 智慧建議客戶VIP | Customer Service VIP | Boolean | TRUE/FALSE |
| 老闆建議客戶VIP | Boss VIP | Boolean | TRUE/FALSE |
| 負責人 | Person In Charge | Text | **Required** - must match system user |
| 生產/包裝/標籤 | Work Type | Text | e.g., "生產＋包裝", "包裝" |
| 物料齊日期 | Material Ready Date | Date | Optional |
| 要求日期 | Requested Delivery Date | Date | Optional |
| 工作描述 | Work Description | Multi-line Text | **Required** (min 10 chars) |
| 生產數量（數粒） | Production Quantity + Unit | Combined | **Auto-parsed!** e.g., "480 瓶" → 480 + "瓶" |
| 包裝數量 | Packaging Quantity + Unit | Combined | **Auto-parsed!** e.g., "2000 盒" → 2000 + "盒" |
| 預計日期 | Expected Delivery Date | Date | Optional |

---

## 🎯 **Quantity Parsing (AUTOMATIC)**

The system **automatically extracts** quantity numbers and units from your combined format:

### **Supported Formats:**

| Your Excel Value | Parsed As | Quantity | Unit |
|-----------------|-----------|----------|------|
| `480 瓶` | ✅ Valid | 480 | 瓶 |
| `23,600粒` | ✅ Valid | 23600 | 粒 |
| `60,000 sachets` | ✅ Valid | 60000 | sachets |
| `2000 盒` | ✅ Valid | 2000 | 盒 |
| `1,180粒` | ✅ Valid | 1180 | 粒 |
| `480` | ✅ Valid | 480 | (no unit) |
| `TBD` | ✅ Valid | (empty) | (empty) |
| `待定` | ✅ Valid | (empty) | (empty) |
| `` (empty) | ✅ Valid | (empty) | (empty) |

### **Recognized Units:**
- **Chinese**: 粒, 瓶, 盒, 袋, 包, 排, 公斤, 克, 個
- **English**: sachets, bottles, boxes, bags, packs, kg, g, pieces
- **Any text** after the number is treated as a unit

---

## 🚀 **Import Process**

### **Step 1: Prepare Your Excel**

Your existing Excel is already good! But if you need to check:

**Required Fields (Must Have Values):**
- ✅ Customer Name (客戶名稱)
- ✅ Person In Charge (負責人) - must match existing user
- ✅ Work Type (生產/包裝/標籤)
- ✅ Work Description (工作描述) - at least 10 characters

**Optional Fields** (Can be empty):
- Job Number, Dates, Quantities, VIP flags, etc.

---

### **Step 2: Navigate to Import Page**

1. Go to `/work-orders` page
2. Look for "匯入" or "Import" button
3. Click to open import dialog

---

### **Step 3: Upload Excel File**

1. **Select File**: Click "選擇文件" and pick your `.xlsx` file
2. **Dry Run (Recommended)**: First upload with "驗證模式" (Validation Mode) checked
   - This will validate ALL 641 rows without importing
   - Shows any errors/warnings before actual import
   - Safe to run multiple times

3. **Review Validation Results**:
   ```
   ✅ Valid Rows: 620
   ⚠️  Warnings: 15 (duplicate job numbers, optional fields)
   ❌ Errors: 6 (missing required fields)
   ```

4. **Fix Errors** (if any):
   - Missing customer names
   - Person in charge not found in system
   - Invalid work type values
   - Work description too short

5. **Actual Import**: Uncheck "驗證模式" and upload again
   - System will import all valid rows
   - Skip rows with errors
   - Show detailed import report

---

### **Step 4: Review Import Results**

After import completes, you'll see:

```
📊 Import Complete!

✅ Successfully Imported: 635 rows
⚠️  Skipped: 6 rows (see details below)

Skipped Rows:
- Row 23: Missing customer name
- Row 87: Person "John" not found in system
- Row 145: Work description too short
...
```

---

## 🔧 **Common Issues & Solutions**

### **Issue 1: "Person In Charge Not Found"**

**Problem**: Your Excel has "Rayvone" but system doesn't recognize it.

**Solution**:
1. Go to `/admin/users` page
2. Check the exact name/nickname of users
3. Update Excel to match **exactly** (case-sensitive)
4. Or add a new user if needed

**Alternative**: The system uses smart fuzzy matching with confidence levels:
- ✅ **Exact Match** (100%): "Raymond" → Raymond
- ✅ **High** (>80%): "Rayvone" → Raymond (typo tolerance)
- ⚠️ **Medium** (>60%): "Ray" → Raymond (nickname)
- ❌ **Low/None**: Shows alternatives in error

**Special Feature - Multiple Names in One Field**: 🆕
- If your Excel has "Raymond/May", "Raymond-May", "Raymond, May", or "Raymond & May"
- System automatically splits names and picks the **first best match**
- Example: "Raymond/May" → Matched to Raymond (if Raymond exists in system)
- No need to manually split multi-person fields!

---

### **Issue 2: "Duplicate Job Number"**

**Problem**: Row 145 has job number "JOB-2023-001" which already exists.

**Solution**: This is just a **warning**, not an error.
- The system will **skip** rows with duplicate job numbers
- You can either:
  - Remove the row from Excel (if it's truly duplicate)
  - Change the job number to be unique
  - Leave it (system will skip automatically)

---

### **Issue 3: "Invalid Date Format"**

**Problem**: Date column shows "2023-10-9" but system can't parse it.

**Solutions**:
- Use ISO format: `2023-10-09` (with leading zero)
- Or Excel date format: System will parse automatically
- Or Chinese format: `2023年10月9日`

---

### **Issue 4: "Invalid Work Type"**

**Problem**: Excel has "包裝+生產" but system doesn't recognize it.

**Valid Values**:
- `包裝` (Packaging)
- `生產` (Production)
- `生產＋包裝` or `生產+包裝` (Production + Packaging)
- `倉務` (Warehousing)

**Solution**: Update Excel to use one of the valid values above.

---

### **Issue 5: "Quantity Parsing Failed"**

**Problem**: System couldn't parse "約480瓶" (with prefix "約").

**Solution**:
- Remove text prefixes: `約480瓶` → `480瓶`
- System only recognizes format: `[number][space][unit]`
- Valid: `480瓶`, `480 瓶`, `23,600粒`
- Invalid: `約480瓶`, `~480`, `480瓶左右`

---

## 📝 **Best Practices**

### **Before Import:**

1. ✅ **Back up your Excel** - Always keep original copy
2. ✅ **Test with 10 rows first** - Import small batch to verify format
3. ✅ **Use Dry Run mode** - Validate before actual import
4. ✅ **Check user names** - Ensure all person-in-charge names exist in system
5. ✅ **Clean up duplicates** - Remove or update duplicate job numbers

### **During Import:**

1. ✅ **Watch for warnings** - They won't block import but should be reviewed
2. ✅ **Note skipped rows** - Save the row numbers for manual entry later
3. ✅ **Don't close browser** - Large imports (641 rows) take time

### **After Import:**

1. ✅ **Verify random samples** - Check 10-20 imported records for accuracy
2. ✅ **Check quantities** - Ensure units were parsed correctly
3. ✅ **Review dates** - Verify all dates imported correctly
4. ✅ **Manually enter skipped rows** - Use the "新增工作單" form

---

## 🎯 **Expected Success Rate**

For your 641-row Excel:

- **Best Case**: 95-100% success (635-641 rows imported)
  - Only fails if data is truly invalid

- **Typical Case**: 90-95% success (575-608 rows imported)
  - Some person names might not match
  - Some optional data might be invalid

- **Worst Case**: 80-90% success (512-575 rows imported)
  - Many person names need updating
  - Several date format issues

**Even with 80% success, you'll only need to manually enter ~130 orders**, which is much better than 641!

---

## 🔍 **Troubleshooting**

### **Import Takes Too Long (>5 minutes)**

- **Check file size**: Should be <10MB
- **Check row count**: 641 rows should import in 2-3 minutes
- **Try smaller batches**: Split into 2-3 files of ~200 rows each

### **All Rows Skipped**

- **Check column headers**: Must match expected Chinese headers exactly
- **Check file format**: Must be `.xlsx` or `.csv`
- **Check encoding**: Excel should be UTF-8 with BOM for Chinese

### **Can't Find Import Button**

- **Check permissions**: Only MANAGER and ADMIN roles can import
- **Contact admin**: If you should have access but don't see the button

---

## 📞 **Need Help?**

If you encounter issues:

1. **Export validation report** - System provides detailed error list
2. **Check specific row numbers** - Errors reference exact Excel row numbers
3. **Test with sample data** - Try importing 5 rows first
4. **Contact developer** - Provide error screenshots and sample rows

---

## ✨ **Summary**

Your 641-row Excel import should be smooth:

1. ✅ **No manual editing** - System parses your existing format
2. ✅ **Automatic quantity parsing** - "480 瓶" → 480 + "瓶"
3. ✅ **Validation first** - See errors before importing
4. ✅ **Batch processing** - All 641 rows at once
5. ✅ **Error handling** - Skip invalid rows, continue with rest
6. ✅ **Detailed reports** - Know exactly what imported and what didn't

**Just upload and go!** 🚀

