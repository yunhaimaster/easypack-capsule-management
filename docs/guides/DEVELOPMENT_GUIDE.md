# 📚 Easy Health 膠囊配方管理系統 - 開發指南

## 📋 目錄
1. [項目概述](#項目概述)
2. [技術架構](#技術架構)
3. [設計系統](#設計系統)
4. [組件結構](#組件結構)
5. [API 設計](#api-設計)
6. [數據庫設計](#數據庫設計)
7. [開發工作流程](#開發工作流程)
8. [部署指南](#部署指南)
9. [常見問題](#常見問題)
10. [維護指南](#維護指南)

---

## 🎯 項目概述

### 項目信息
- **名稱**: Easy Health 膠囊配方管理系統
- **版本**: v2.1.0
- **技術棧**: Next.js 14, React 18, TypeScript, Prisma, Tailwind CSS
- **部署**: Vercel
- **數據庫**: PostgreSQL (生產), SQLite (開發)

### 核心功能
- 膠囊配方建檔與管理
- 生產訂單記錄
- AI 智能分析助手（Smart AI / Order AI）
- 原料風險評估
- 統計報表、工作單生成
- PDF 參考資料下載中心
- Liquid Glass 品牌化 UI 與動畫

---

## 🏗️ 技術架構

### 前端架構
```
src/
├── app/                    # Next.js App Router 頁面
├── components/            # React 組件
│   ├── ui/               # 基礎 UI 組件
│   ├── ai/               # AI 助手組件
│   ├── forms/            # 表單組件
│   ├── orders/           # 訂單相關組件
│   └── auth/             # 認證組件
├── hooks/                # 自定義 Hooks
├── lib/                  # 工具函數和配置
└── types/                # TypeScript 類型定義
```

### 後端架構
```
src/app/api/
├── ai/                   # AI 相關 API
├── orders/               # 訂單管理 API
├── ingredients/          # 原料統計 API
└── migrate/              # 數據庫遷移 API
```

---

## 🎨 設計系統

### 核心設計原則
1. **iOS 26 Liquid Glass 設計語言**
2. **統一的霧化玻璃效果**
3. **響應式設計優先**
4. **無障礙功能支持**

### 品牌設計 Token 摘要

> 完整 token 請參考 `BRAND_TOKEN_TABLE.md`

```css
:root {
  /* 色彩 */
  --brand-primary: 202 88% 42%;
  --brand-secondary: 187 60% 70%;
  --brand-accent: 224 35% 65%;
  --brand-neutral: 215 48% 18%;

  /* 字體 */
  --font-brand-display: "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  --font-brand-text: "SF Pro Text", "Helvetica Neue", Arial, sans-serif;

  /* 玻璃效果 */
  --glass-opacity: 0.12;
  --glass-border-opacity: 0.20;
  --glass-hover-opacity: 0.16;
  --brand-blur-strong: 28px;
  --brand-blur-medium: 18px;
  --brand-blur-soft: 12px;

  /* 陰影與漸層 */
  --brand-shadow-soft: 0 18px 46px rgba(34, 86, 122, 0.18);
  --brand-shadow-medium: 0 12px 32px rgba(31, 78, 112, 0.16);
  --brand-shadow-inner: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  --brand-gradient-primary: linear-gradient(135deg, rgba(42, 150, 209, 0.9), rgba(32, 105, 157, 0.85));
}
```

### 卡片與 Modal 系統
```css
/* Liquid Glass Card 家族 */
.liquid-glass-card
.liquid-glass-card-brand
.liquid-glass-card-elevated
.liquid-glass-card-interactive
.liquid-glass-card-refraction

/* AI Modal 佈局與訊息泡泡 */
.liquid-glass-modal.ai-chat-modal
.ai-modal-shell
.ai-modal-stream
.ai-message-assistant
.ai-message-user
.ai-modal-input-row

/* 確認 Modal */
.liquid-glass-modal.confirm-modal
.confirm-modal-icon
.confirm-modal-actions
```

### 圖標容器系統
```css
/* 基礎容器 */
.icon-container

/* 顏色變體 */
.icon-container-blue
.icon-container-red
.icon-container-yellow
.icon-container-green
.icon-container-purple
.icon-container-emerald
.icon-container-orange
```

### 響應式斷點
- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: 768px - 1024px
- **Large Desktop**: 1024px - 2560px
- **5K Display**: > 2560px

---

## 🧩 組件結構

### UI 組件庫

#### 基礎組件
- `Button` - 統一的按鈕組件
- `Card` - 卡片容器組件
- `Input` - 輸入框組件
- `Select` - 下拉選擇組件
- `Textarea` - 文本區域組件

#### 特殊組件
- `LiquidGlassModal` - 霧化玻璃模態框
- `LiquidGlassNav` - 導航欄組件
- `LiquidGlassHero` - 英雄區域組件
- `ErrorBoundary` - 錯誤邊界組件
- `PerformanceMonitor` - 性能監控組件

#### AI 組件
- `SmartAIAssistant` - 智能 AI 助手
- `OrderAIAssistant` - 訂單 AI 助手
- `AIThinkingIndicator` - AI 思考指示器
- `AIRealReasoning` - AI 真實推理顯示
- `AIDisclaimer` - AI 免責聲明
- `AISettings` - AI 設置組件

### 組件使用規範

#### 創建新組件
```typescript
// 1. 創建組件文件
// src/components/ui/my-component.tsx

import React from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  className?: string
  children?: React.ReactNode
}

export function MyComponent({ 
  className, 
  children 
}: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  )
}
```

#### 使用液態玻璃樣式
```typescript
// 正確的卡片結構
<div className="liquid-glass-card liquid-glass-card-interactive">
  <div className="liquid-glass-content">
    {/* 內容 */}
  </div>
</div>

// 正確的圖標容器
<div className="icon-container icon-container-blue">
  <Icon className="h-4 w-4 text-white" />
</div>
```

---

## 🔌 API 設計

### AI API 端點

#### `/api/ai/chat`
- **方法**: POST
- **功能**: AI 聊天對話
- **參數**:
  ```typescript
  {
    message: string
    orders?: Order[]
    context?: Context
    enableReasoning?: boolean
  }
  ```

#### `/api/ai/parse-recipe`
- **方法**: POST
- **功能**: AI 配方解析
- **參數**:
  ```typescript
  {
    recipeText: string
  }
  ```

#### `/api/ai/assess-risk`
- **方法**: POST
- **功能**: AI 風險評估
- **參數**:
  ```typescript
  {
    materials: Material[]
  }
  ```

### 訂單 API 端點

#### `/api/orders`
- **GET**: 獲取訂單列表
- **POST**: 創建新訂單

#### `/api/orders/[id]`
- **GET**: 獲取單個訂單
- **PUT**: 更新訂單
- **DELETE**: 刪除訂單

### API 設計原則
1. **RESTful 設計**
2. **統一的錯誤處理**
3. **TypeScript 類型安全**
4. **適當的 HTTP 狀態碼**

---

## 🗄️ 數據庫設計

### 主要表結構

#### ProductionOrder
```sql
CREATE TABLE "ProductionOrder" (
  "id" TEXT PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "capsuleType" TEXT NOT NULL,
  "capsuleColor" TEXT NOT NULL,
  "productionQuantity" INTEGER NOT NULL,
  "completionDate" TIMESTAMP,
  "processIssues" TEXT,
  "qualityNotes" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Ingredient
```sql
CREATE TABLE "Ingredient" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "materialName" TEXT NOT NULL,
  "unitContentMg" REAL NOT NULL,
  "isCustomerProvided" BOOLEAN DEFAULT true,
  FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id")
);
```

### 數據庫操作規範

#### 使用 Prisma
```typescript
// 查詢示例
const orders = await prisma.productionOrder.findMany({
  include: {
    ingredients: true
  },
  orderBy: {
    createdAt: 'desc'
  }
})

// 創建示例
const order = await prisma.productionOrder.create({
  data: {
    customerName,
    productName,
    // ... 其他字段
    ingredients: {
      create: ingredients.map(ingredient => ({
        materialName: ingredient.materialName,
        unitContentMg: ingredient.unitContentMg,
        isCustomerProvided: ingredient.isCustomerProvided
      }))
    }
  }
})
```

---

## 🔄 開發工作流程

### 本地開發設置

#### 1. 環境準備
```bash
# 安裝依賴
npm install

# 設置環境變數
cp .env.example .env.local
# 編輯 .env.local 添加必要的環境變數

# 生成 Prisma 客戶端
npx prisma generate

# 運行數據庫遷移
npx prisma migrate dev
```

#### 2. 開發服務器
```bash
# 啟動開發服務器
npm run dev

# 類型檢查
npm run type-check

# 代碼檢查
npm run lint

# 構建測試
npm run build
```

### 代碼規範

#### TypeScript 規範
```typescript
// 1. 使用 interface 定義類型
interface OrderProps {
  id: string
  customerName: string
  // ...
}

// 2. 使用泛型提高可重用性
function useApi<T>(endpoint: string): { data: T | null; loading: boolean } {
  // ...
}

// 3. 使用 enum 定義常量
enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

#### React 組件規範
```typescript
// 1. 使用函數組件
export function MyComponent({ prop1, prop2 }: Props) {
  // 2. 使用 hooks 管理狀態
  const [state, setState] = useState(initialValue)
  
  // 3. 使用 useEffect 處理副作用
  useEffect(() => {
    // 副作用邏輯
  }, [dependency])
  
  // 4. 返回 JSX
  return <div>{/* 組件內容 */}</div>
}
```

### Git 工作流程

#### 提交規範
```bash
# 功能新增
git commit -m "✨ 新增功能: 添加 AI 風險評估功能"

# 錯誤修復
git commit -m "🐛 修復: 修復訂單列表分頁問題"

# 樣式改進
git commit -m "🎨 樣式: 統一卡片設計風格"

# 文檔更新
git commit -m "📚 文檔: 更新開發指南"

# 重構
git commit -m "♻️ 重構: 優化 AI 助手組件結構"
```

#### 分支管理
```bash
# 創建功能分支
git checkout -b feature/new-feature

# 創建修復分支
git checkout -b fix/bug-fix

# 合併到主分支
git checkout main
git merge feature/new-feature
git push origin main
```

---

## 🚀 部署指南

### Vercel 部署

#### 環境變數設置
在 Vercel 控制台設置以下環境變數：
```
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=your-api-key
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### 部署步驟
1. 推送代碼到 GitHub
2. Vercel 自動檢測並部署
3. 運行數據庫遷移
4. 驗證部署結果

### 數據庫遷移
```bash
# 本地遷移
npx prisma migrate dev

# 生產環境遷移
npx prisma migrate deploy
```

---

## ❓ 常見問題

### 開發問題

#### Q: 如何添加新的 API 端點？
A: 
1. 在 `src/app/api/` 下創建新的路由文件
2. 導出 HTTP 方法函數 (GET, POST, PUT, DELETE)
3. 使用 NextRequest 和 NextResponse 處理請求
4. 添加適當的錯誤處理和類型驗證

#### Q: 如何添加新的頁面？
A:
1. 在 `src/app/` 下創建新的目錄
2. 添加 `page.tsx` 文件
3. 使用統一的頁面結構和樣式
4. 確保響應式設計

#### Q: 如何修改數據庫結構？
A:
1. 修改 `prisma/schema.prisma`
2. 運行 `npx prisma migrate dev --name description`
3. 更新相關的 TypeScript 類型
4. 測試數據庫操作

### 樣式問題

#### Q: 如何保持視覺一致性？
A:
1. 使用預定義的 CSS 類
2. 遵循設計系統規範
3. 使用統一的組件庫
4. 定期檢查視覺一致性

#### Q: 如何添加新的卡片樣式？
A:
1. 在 `globals.css` 中定義新的 CSS 類
2. 遵循現有的命名規範
3. 使用統一的設計變數
4. 測試響應式效果

### AI 功能問題

#### Q: 如何修改 AI 系統提示詞？
A:
1. 找到對應的 API 路由文件
2. 修改 `systemPrompt` 變數
3. 測試 AI 回應質量
4. 更新相關文檔

#### Q: 如何添加新的 AI 功能？
A:
1. 創建新的 API 端點
2. 定義請求和回應類型
3. 創建對應的 React 組件
4. 集成到現有頁面

---

## 🛠️ 維護指南

### 定期維護任務

#### 每週檢查
- [ ] 檢查構建狀態
- [ ] 運行代碼檢查
- [ ] 測試核心功能
- [ ] 檢查依賴更新

#### 每月檢查
- [ ] 更新依賴包
- [ ] 檢查安全漏洞
- [ ] 優化性能
- [ ] 更新文檔

#### 每季度檢查
- [ ] 代碼重構
- [ ] 架構評估
- [ ] 用戶反饋分析
- [ ] 功能規劃

### 性能監控

#### 前端性能
- 使用 `PerformanceMonitor` 組件監控載入時間
- 檢查 Bundle 大小
- 優化圖片和資源

#### 後端性能
- 監控 API 回應時間
- 檢查數據庫查詢性能
- 優化 AI API 調用

### 安全維護

#### API 安全
- 定期更新 API 密鑰
- 檢查環境變數配置
- 實施適當的錯誤處理

#### 數據安全
- 定期備份數據庫
- 檢查數據驗證
- 實施適當的權限控制

### 文檔維護

#### 保持文檔更新
- 代碼更改時同步更新文檔
- 定期檢查文檔準確性
- 添加新的使用示例

#### 知識傳承
- 記錄重要的設計決策
- 維護常見問題解答
- 創建故障排除指南

---

## 📞 聯繫與支持

### 開發團隊
- **主要開發者**: Victor
- **技術支持**: 直接聯繫 Victor
- **功能建議**: 歡迎提出改進建議

### 有用的鏈接
- [Next.js 文檔](https://nextjs.org/docs)
- [React 文檔](https://react.dev/)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Prisma 文檔](https://www.prisma.io/docs)
- [Vercel 部署文檔](https://vercel.com/docs)

---

*最後更新: 2025年9月30日*
*版本: v2.1.0*
