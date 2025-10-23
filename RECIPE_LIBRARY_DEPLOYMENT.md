# 配方庫功能 - 部署指南

## 🎉 配方庫功能已完成

### ✅ 已完成的功能

#### 1. 數據庫架構
- ✅ 新增 `RecipeLibrary` 模型到 Prisma schema
- ✅ 實現配方指紋（SHA-256）去重機制
- ✅ 支援多個來源訂單（sourceOrderIds）
- ✅ 完整的統計數據追蹤（productionCount, usageCount）

#### 2. API 路由（已實現）
- ✅ `GET /api/recipes` - 配方列表（支援搜尋、篩選、分頁）
- ✅ `GET /api/recipes/[id]` - 配方詳情
- ✅ `PUT /api/recipes/[id]` - 更新配方
- ✅ `DELETE /api/recipes/[id]` - 刪除配方
- ✅ `GET /api/recipes/from-order/[orderId]` - 檢查訂單配方狀態
- ✅ `POST /api/recipes/from-order/[orderId]` - 從訂單保存配方
- ✅ `POST /api/recipes/batch-import` - 批量導入配方
- ✅ `POST /api/recipes/[id]/use` - 使用配方（更新 usageCount）

#### 3. 前端頁面
- ✅ `/recipe-library` - 配方庫列表頁（含搜尋、批量導入）
- ✅ `/recipe-library/[id]` - 配方詳情頁（含統計、來源訂單）
- ✅ 訂單詳情頁整合「保存配方」按鈕
- ✅ 新建訂單頁支援從配方預填資料（`?recipeId=xxx`）
- ✅ 導航選單新增配方庫入口（工具分類第一位）

#### 4. UI 組件
- ✅ `SaveRecipeDialog` - 保存配方對話框（含重複檢測提示）
- ✅ RecipeCard - 配方卡片（Liquid Glass 設計風格）
- ✅ 響應式設計（支援手機、平板、桌面）

#### 5. 核心功能
- ✅ 智能去重：相同客戶+產品+原料組合只保存一次
- ✅ 統計追蹤：記錄生產次數和使用次數
- ✅ 快速創建訂單：從配方一鍵創建新訂單
- ✅ 搜尋功能：支援配方名稱、客戶名稱、產品名稱、原料名稱
- ✅ 批量導入：從所有已完成訂單自動導入配方

---

## 🚀 部署步驟

### 步驟 1: 推送代碼到 GitHub（✅ 已完成）
```bash
git add .
git commit -m "feat: Add Recipe Library feature"
git push origin main
```

### 步驟 2: Vercel 自動部署
- Vercel 會自動檢測到推送並開始構建
- 構建命令：`npm run build`（包含 `prisma generate`）

### 步驟 3: 執行數據庫遷移 ⚠️ **必須手動執行**

#### 選項 A: 使用 Vercel CLI（推薦）
```bash
# 1. 安裝 Vercel CLI（如果尚未安裝）
npm install -g vercel

# 2. 登入 Vercel
vercel login

# 3. 連接到項目
vercel link

# 4. 拉取環境變數
vercel env pull .env.local

# 5. 執行遷移
npx prisma migrate deploy
```

#### 選項 B: 使用 Vercel Dashboard
1. 前往 Vercel Dashboard → 你的項目
2. Settings → Environment Variables
3. 複製 `DATABASE_URL` 值
4. 在本地終端執行：
```bash
DATABASE_URL="複製的數據庫URL" npx prisma migrate deploy
```

#### 選項 C: 使用 Prisma Data Platform
1. 前往 [Prisma Data Platform](https://cloud.prisma.io)
2. 連接你的 Vercel 項目
3. 執行遷移

---

## 📋 遷移內容

### 新增表 `recipe_library`
- `id` (String, CUID) - 主鍵
- `recipeName` (String) - 配方名稱
- `description` (Text?) - 配方描述
- `sourceOrderIds` (Text) - 來源訂單 ID JSON 陣列
- `customerName` (String) - 客戶名稱
- `productName` (String) - 產品名稱
- `ingredients` (Text) - 原料清單 JSON
- `unitWeightMg` (Float) - 單粒總重量
- **`recipeFingerprint` (String, UNIQUE)** - 配方指紋（用於去重）
- `capsuleColor` (String?) - 膠囊顏色
- `capsuleSize` (String?) - 膠囊大小
- `capsuleType` (String?) - 膠囊類型
- `category` (String?) - 分類
- `tags` (Text?) - 標籤 JSON
- `productionCount` (Int) - 生產次數（默認 1）
- `usageCount` (Int) - 使用次數（默認 0）
- `lastUsedAt` (DateTime?) - 最後使用日期
- `lastProductionAt` (DateTime?) - 最後生產日期
- `notes` (Text?) - 備註
- `isActive` (Boolean) - 是否啟用（默認 true）
- `createdBy` (String?) - 創建者
- `createdAt` (DateTime) - 創建時間
- `updatedAt` (DateTime) - 更新時間

### 索引
- `@@unique([recipeFingerprint])` - 唯一索引（防止重複）
- `@@index([customerName])`
- `@@index([productName])`
- `@@index([recipeName])`
- `@@index([category, isActive])`
- `@@index([productionCount])`
- `@@index([usageCount])`
- `@@index([createdAt])`

---

## 🔧 部署後檢查清單

### 1. 驗證數據庫遷移
```bash
# 檢查表是否已創建
psql $DATABASE_URL -c "\d recipe_library"
```

### 2. 測試 API 端點
- ✅ 訪問 `/api/recipes` 確認返回 `{ success: true, data: { recipes: [], ... } }`
- ✅ 訪問配方庫頁面 `/recipe-library`

### 3. 測試完整流程
1. ✅ 創建並完成一個生產訂單
2. ✅ 在訂單詳情頁點擊「保存配方」
3. ✅ 前往配方庫 `/recipe-library` 查看新配方
4. ✅ 點擊「創建訂單」測試自動填充功能
5. ✅ 測試搜尋功能
6. ✅ 測試批量導入功能

---

## 🐛 故障排除

### 問題 1: 構建時出現 `DATABASE_URL is not defined`
**原因**：本地構建時沒有環境變數
**解決**：
- 在 Vercel 上構建時會自動注入環境變數
- 如果需要本地構建，創建 `.env.local`：
```bash
DATABASE_URL="postgresql://user:pass@host/db"
```

### 問題 2: 遷移失敗 `relation "recipe_library" does not exist`
**原因**：尚未執行數據庫遷移
**解決**：按照「步驟 3」執行 `prisma migrate deploy`

### 問題 3: 配方指紋衝突錯誤
**原因**：嘗試導入相同配方
**解決**：這是正常行為！系統會自動更新現有配方而不是創建重複項

### 問題 4: 批量導入失敗
**可能原因**：
- 沒有已完成的訂單
- 數據庫連接問題
- 權限問題

**解決**：檢查瀏覽器控制台和 Vercel 日誌

---

## 📊 使用統計

部署完成後，你可以：
- 📈 查看最常用的配方（按 `usageCount` 排序）
- 📊 查看生產次數最多的配方（按 `productionCount` 排序）
- 🔍 搜尋特定原料的配方
- 📦 快速創建重複訂單

---

## 🎯 下一步

### 可選的增強功能（未來版本）
- [ ] 配方版本控制
- [ ] 配方模板（預設配方）
- [ ] 配方比較功能
- [ ] 批量編輯配方
- [ ] 配方導出（PDF/Excel）
- [ ] 配方審核流程
- [ ] 成本計算功能

---

## 📝 代碼變更摘要

### 新增文件
- `prisma/schema.prisma` - 新增 RecipeLibrary 模型
- `src/lib/recipe-fingerprint.ts` - 配方指紋生成器
- `src/types/index.ts` - 配方庫類型定義
- `src/app/api/recipes/route.ts` - 配方列表 API
- `src/app/api/recipes/[id]/route.ts` - 配方詳情 API
- `src/app/api/recipes/[id]/use/route.ts` - 使用配方 API
- `src/app/api/recipes/from-order/[orderId]/route.ts` - 從訂單保存配方 API
- `src/app/api/recipes/batch-import/route.ts` - 批量導入 API
- `src/app/recipe-library/page.tsx` - 配方庫列表頁
- `src/app/recipe-library/[id]/page.tsx` - 配方詳情頁
- `src/components/recipe-library/save-recipe-dialog.tsx` - 保存配方對話框

### 修改文件
- `src/data/navigation.ts` - 新增配方庫導航
- `src/app/orders/[id]/page.tsx` - 新增保存配方按鈕
- `src/app/orders/new/page.tsx` - 支援從配方預填

### Git Commit
```
commit 3966e68
Author: [Your Name]
Date: [Date]

feat: Add Recipe Library feature

- Add RecipeLibrary model to Prisma schema with unique fingerprint
- Implement recipe fingerprint generator using SHA-256 hash
- Add comprehensive TypeScript types for recipe library
- Create API routes for recipe CRUD operations
- Implement batch import from completed production orders
- Add recipe library listing page with search and filters
- Create recipe detail page with full information display
- Add SaveRecipeDialog component for recipe creation
- Integrate save recipe button in order detail page
- Support pre-filling new order form from recipe
- Add recipe library to navigation menu
- Fix icon imports (Flask -> Beaker) for compatibility
- Fix React hooks dependencies and TypeScript type issues
```

---

## ✅ 部署完成！

一旦數據庫遷移完成，配方庫功能即可在生產環境中使用。

**部署時間**: [待更新]  
**部署 URL**: https://[your-project].vercel.app/recipe-library  
**狀態**: 🟡 待執行數據庫遷移

