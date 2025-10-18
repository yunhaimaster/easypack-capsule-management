# 🧪 訂單配方導出至製粒分析功能

## 📝 功能概述

此功能允許用戶從訂單詳情頁面一鍵將訂單的配方原料導出至製粒分析頁面，進行深入的專業分析。

## ✨ 功能亮點

- ✅ **兩個入口**：訂單詳情頁按鈕 + Order AI 助手內快捷按鈕
- ✅ **確認對話框**：清晰顯示訂單資訊和將導出的原料清單
- ✅ **自動填入**：跳轉後自動載入配方至製粒分析頁面
- ✅ **3 模型分析**：使用 GPT-4.1 Mini、Grok 4 Fast、DeepSeek v3.1 進行專業製粒分析
- ✅ **數據驗證**：自動檢查訂單是否有有效的配方原料

## 🎯 使用方式

### 方式一：訂單詳情頁按鈕

1. 進入任何訂單的詳情頁面 (`/orders/[id]`)
2. 點擊頂部操作區域的「製粒分析」按鈕（紫色，Brain 圖標）
3. 在彈出的確認對話框中查看訂單資訊和原料清單
4. 點擊「確認導出」按鈕
5. 自動跳轉至製粒分析頁面，配方已自動填入

### 方式二：Order AI 助手快捷按鈕

1. 在訂單詳情頁，點擊「AI 助手」按鈕打開 Order AI
2. 在 AI 助手對話框的標題列，點擊 Brain 圖標（在 AI 設置按鈕旁邊）
3. 在彈出的確認對話框中查看訂單資訊和原料清單
4. 點擊「確認導出」按鈕
5. 自動跳轉至製粒分析頁面，配方已自動填入

## 🔧 技術實現

### 文件結構

```
src/
├── lib/
│   └── granulation-export.ts          # 核心工具函數
├── components/
│   └── granulation/
│       └── export-confirmation-dialog.tsx  # 確認對話框組件
├── app/
│   ├── orders/[id]/page.tsx           # 訂單詳情頁（新增按鈕）
│   └── granulation-analyzer/page.tsx   # 製粒分析頁（新增自動導入）
└── components/ai/
    └── order-ai-assistant.tsx          # Order AI（新增快捷按鈕）
```

### 核心函數

#### `exportOrderToGranulation(order: ProductionOrder): void`

將訂單配方導出到製粒分析頁面：

- 驗證訂單是否有有效原料
- 轉換原料格式為製粒分析所需格式
- 使用 `sessionStorage` 儲存配方資料
- 導航至 `/granulation-analyzer?source=order&orderId={id}`

#### `validateOrderForGranulation(order: ProductionOrder)`

驗證訂單是否可以導出：

- 檢查訂單是否有原料配方
- 檢查原料資料是否完整（materialName、unitContentMg）
- 返回驗證結果和錯誤訊息

#### `getGranulationImportData(): GranulationIngredient[] | null`

在製粒分析頁面讀取導入的配方資料：

- 從 `sessionStorage` 讀取配方資料
- 驗證資料格式
- 讀取後立即清除 `sessionStorage`
- 返回格式化的原料陣列

### 資料流程

```
訂單詳情頁 / Order AI 助手
    ↓
點擊「製粒分析」按鈕
    ↓
validateOrderForGranulation(order)  // 驗證訂單
    ↓
顯示確認對話框
    ↓
用戶確認
    ↓
exportOrderToGranulation(order)
    ├─ 轉換原料格式
    ├─ 儲存至 sessionStorage
    └─ 導航至製粒分析頁
        ↓
製粒分析頁面 useEffect
    ├─ getGranulationImportData()
    ├─ 讀取並驗證資料
    ├─ 設置 ingredients state
    └─ 顯示成功提示
```

## 🎨 UI 設計

### 按鈕樣式

- **位置**：訂單詳情頁操作按鈕區域（Order AI 和編輯按鈕之間）
- **顏色**：紫色 (`bg-purple-600`)
- **圖標**：Brain (lucide-react)
- **文字**：「製粒分析」

### 確認對話框

包含以下區域：

1. **標題**：「導出至製粒分析」（帶 Brain 圖標）
2. **訂單資訊卡**：
   - 客戶名稱
   - 產品名稱
   - 生產數量
   - 原料數量
3. **原料清單表格**：
   - 序號
   - 原料品名
   - 單粒含量 (mg)
4. **說明提示**：導出後的流程說明
5. **操作按鈕**：取消 / 確認導出

## ⚠️ 錯誤處理

### 無效訂單

如果訂單沒有原料或原料資料不完整：

- 顯示錯誤提示
- 不開啟確認對話框
- 建議用戶檢查訂單配方

### SessionStorage 不可用

如果瀏覽器不支援 sessionStorage：

- 自動降級使用 URL query params
- 不影響功能正常使用

### 導入資料驗證失敗

如果製粒頁面無法讀取或驗證導入資料：

- 靜默失敗
- 製粒頁面保持原有空白狀態
- 用戶可手動輸入或使用智能導入

## 🧪 測試檢查清單

### 功能測試

- [ ] 點擊訂單詳情頁「製粒分析」按鈕
- [ ] 點擊 Order AI 助手內 Brain 圖標
- [ ] 確認對話框正確顯示訂單資訊
- [ ] 確認對話框正確顯示原料清單
- [ ] 點擊「確認導出」跳轉至製粒分析頁
- [ ] 製粒分析頁自動填入配方
- [ ] 成功提示顯示導入的原料數量

### 邊界測試

- [ ] 訂單沒有原料時顯示錯誤提示
- [ ] 訂單原料資料不完整時顯示錯誤提示
- [ ] 原料含量為 0 或負數時過濾掉
- [ ] 原料名稱為空時過濾掉
- [ ] 多次導出不會重複填入

### UI/UX 測試

- [ ] 按鈕樣式符合設計規範（紫色）
- [ ] 對話框在各裝置上正確顯示（響應式）
- [ ] Loading 狀態和錯誤狀態正確顯示
- [ ] 導航過渡流暢

## 📊 數據格式

### SessionStorage 格式

```typescript
interface GranulationIngredient {
  materialName: string      // 原料品名
  unitContentMg: number     // 單粒含量 (mg)
  isCustomerProvided: boolean  // 是否客戶指定
}
```

**Storage Key**: `'granulation-import-data'`

### URL Query Params（後備方案）

```
/granulation-analyzer?source=order&orderId=abc123&data=<encoded_json>
```

## 🚀 未來優化方向

- [ ] 支援批量導出多個訂單
- [ ] 記錄導出歷史
- [ ] 支援自訂原料篩選
- [ ] 導出後保留製粒分析結果與訂單關聯
- [ ] 支援從製粒分析結果直接回到原訂單

---

**最後更新**: 2025-01-13  
**版本**: 1.0.0

