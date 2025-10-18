# EasyPack 膠囊配方管理系統

一個專為保健品公司設計的內部生產管理系統，提供完整的膠囊配方建檔、生產記錄管理與智能分析功能。

## 📚 文檔指南

### 🔧 開發文檔
- **[開發指南](DEVELOPMENT_GUIDE.md)** - 完整的開發指南和架構說明
- **[組件使用指南](COMPONENT_USAGE_GUIDE.md)** - 組件使用方法和最佳實踐
- **[API 文檔](API_DOCUMENTATION.md)** - 完整的 API 接口文檔
- **[部署維護指南](DEPLOYMENT_MAINTENANCE.md)** - 部署和維護指南
- **[快速參考](QUICK_REFERENCE.md)** - 常用命令和快速參考
- **[登入系統指南](LOGIN_GUIDE.md)** - 登入系統說明和密碼管理

### 🎯 快速開始
1. 查看 [開發指南](DEVELOPMENT_GUIDE.md) 了解項目架構
2. 閱讀 [組件使用指南](COMPONENT_USAGE_GUIDE.md) 學習如何使用組件
3. 參考 [快速參考](QUICK_REFERENCE.md) 獲取常用命令
4. 查看 [API 文檔](API_DOCUMENTATION.md) 了解接口規範

## 🚀 最新功能 (v2.0.0 - 2024/10/16)

### 🎨 AI 行銷設計智能化（重大更新）
- 🎯 **智能適應式設計**：AI 根據產品功效自動選擇最合適的視覺風格
- 🌈 **獨特視覺識別**：每個產品生成獨特的包裝設計、配色與工藝風格
- 🎭 **產品特性分析**：依據成分推導設計語言（睡眠→柔和藍紫、運動→活力橙紅）
- 👥 **目標客群適配**：標籤工藝依客群選擇（年輕→簡約、高端→特殊工藝）
- 📸 **場景化 Prompt**：圖像生成根據使用時機選擇合適場景與道具
- ✨ **設計差異化**：確保不同產品形成明顯視覺區隔

### 🚀 核心功能模組
- 📊 **行銷設計助手**：完整行銷策略 + 包裝設計方案（DeepSeek Chat v3.1）
- 🔬 **顆粒分析器**：三模型並行（GPT-5 + Claude Sonnet 4.5 + Grok 4）+ 共識機制
- 🧪 **AI 配方生成器**：根據目標功效智能生成配方建議
- 📚 **配方庫系統**：配方保存、管理、AI 功效分析與一鍵套用
- 🏷️ **AI 標籤設計**：符合香港法規的產品標籤自動生成
- 🎨 **包裝圖像生成**：實拍瓶身、情境場景、平鋪構圖三種視覺
- 💰 **智能價格分析**：原料市場價格分析與成本計算
- ⚠️ **風險評估系統**：配方原料安全性與法規合規評估

### 🔐 安全與管理功能
- 🔒 **訂單鎖定機制**：密碼保護防止誤刪除或修改
- ✅ **密碼驗證**：編輯或刪除鎖定訂單需驗證密碼
- 🔑 **視覺標識**：鎖定訂單顯示鎖頭圖標

### 📚 配方庫增強
- 🤖 **AI 功效分析**：自動分析配方的健康功效與作用機制
- ⚡ **批量分析**：支援多個配方同時進行功效分析
- 📥 **配方導入**：從生產訂單快速創建配方庫條目
- 📊 **使用追蹤**：記錄配方使用次數與最後使用時間
- 🎯 **快速套用**：一鍵將配方套用到新訂單或行銷分析

### 🎯 用戶體驗提升
- 🧠 **智能配方導入**：支援文字和圖片智能識別
- ⚡ **實時 AI 回饋**：串流回應，即時顯示生成內容
- ⏱️ **處理時間顯示**：AI 分析時顯示已耗用時間
- 🔄 **重試機制**：AI 失敗後可快速重試
- 📝 **Markdown 渲染**：AI 回應支援完整格式化顯示

### 膠囊規格管理
- 🎨 **膠囊顏色**：支援多種顏色選擇
- 📏 **膠囊大小**：#1、#0、#00 三種規格
- 🧪 **膠囊成分**：明膠胃溶、植物胃溶、明膠腸溶、植物腸溶

## 功能特色

### 配方建檔模組
- ✅ 新增/編輯膠囊配方與規格
- ✅ 動態原料條目管理
- ✅ 即時驗證與自動計算
- ✅ 膠囊規格選擇與管理

### 生產記錄模組
- ✅ 記錄清單檢視與搜尋篩選
- ✅ 多維度排序與分頁
- ✅ 詳細記錄查看與編輯
- ✅ CSV 匯出功能（支援中文編碼）
- ✅ 響應式表格設計

### 智能分析功能
- ✅ **Smart AI 助手**：生產數據分析（DeepSeek Chat v3.1）
- ✅ **行銷設計助手**：行銷策略與包裝設計（DeepSeek Chat v3.1）
- ✅ **顆粒分析器**：三模型並行分析 + 共識機制（GPT-5 + Claude Sonnet 4.5 + Grok 4）
- ✅ **AI 配方生成器**：智能配方建議（多模型並行）
- ✅ **AI 功效分析**：配方健康功效分析
- ✅ **動態建議問題**：基於回答內容的智能推薦
- ✅ **對話歷史管理**：聊天記錄保存與導出
- ✅ **AI 翻譯功能**：簡體中文轉繁體中文
- ✅ **AI 標籤設計**：自動生成符合香港法規的產品標籤
- ✅ **包裝圖像生成**：三種視覺風格的產品圖像

### 自動計算功能
- ✅ 單粒總重量自動加總
- ✅ 各原料批次用量計算
- ✅ 智慧單位轉換 (mg/g/kg)
- ✅ 批次總重量合計

## 技術架構

- **前端**: Next.js 14 + React + TypeScript + Tailwind CSS
- **後端**: Next.js API Routes + Prisma ORM
- **資料庫**: SQLite (開發) / PostgreSQL (生產)
- **AI 模型**: 
  - DeepSeek Chat v3.1（行銷設計、Smart AI、聊天）
  - OpenAI GPT-5（顆粒分析、配方生成）
  - Anthropic Claude Sonnet 4.5（顆粒分析、共識機制）
  - xAI Grok 4（顆粒分析）
  - OpenAI GPT-5 Mini（一般問答）
- **表單驗證**: React Hook Form + Zod
- **UI 組件**: Radix UI + Lucide React + 自訂 Liquid Glass 設計系統
- **匯出功能**: CSV 匯出、顆粒分析匯出

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
cp env.example .env.local
```

編輯 `.env.local` 檔案，設定資料庫連線、登入密碼和 AI API 金鑰：

```env
DATABASE_URL="file:./prisma/dev.db"
LOGIN="2356"
OPENROUTER_API_KEY="your_openrouter_api_key_here"
OPENROUTER_API_URL="https://openrouter.ai/api/v1/chat/completions"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**重要**：AI 功能需要 OpenRouter API 金鑰才能運作。

### 3. 初始化資料庫

```bash
# 生成 Prisma 客戶端
npm run db:generate

# 推送資料庫結構
npm run db:push

# 種子測試資料
npm run db:seed
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看應用程式。

## 專案結構

```
capsuleDB/
├── prisma/
│   ├── schema.prisma          # 資料庫結構定義
│   └── seed.ts               # 測試資料種子
├── src/
│   ├── app/
│   │   ├── api/              # API 路由
│   │   ├── globals.css       # 全域樣式
│   │   ├── layout.tsx        # 根佈局
│   │   └── page.tsx          # 首頁
│   ├── components/           # React 組件
│   ├── lib/                  # 工具函數
│   └── types/                # TypeScript 類型定義
├── tests/                    # 測試檔案
├── env.example              # 環境變數範例
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 部署指南

### 開發環境
1. 使用 SQLite 資料庫
2. 執行 `npm run dev` 啟動開發伺服器

### 生產環境
1. 設定 PostgreSQL 資料庫
2. 更新 `.env.local` 中的 `DATABASE_URL`
3. 執行 `npm run build` 建置專案
4. 執行 `npm start` 啟動生產伺服器

### Vercel 部署 (推薦)
```bash
# 1. 推送代碼到 GitHub
git push origin main

# 2. 在 Vercel 中導入專案
# 3. 設定環境變數（重要！）
#    - LOGIN=2356（登入密碼）
#    - DATABASE_URL（PostgreSQL 連線）
#    - OPENROUTER_API_KEY（AI 功能）
# 4. 自動部署完成
```

詳細部署指南請參考：
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署流程
- [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) - 環境變數設置
- [LOGIN_GUIDE.md](./LOGIN_GUIDE.md) - 登入系統說明

## API 端點

### 訂單管理
- `GET /api/orders` - 取得生產訂單清單
- `POST /api/orders` - 創建新訂單
- `GET /api/orders/[id]` - 取得特定訂單
- `PUT /api/orders/[id]` - 更新訂單
- `DELETE /api/orders/[id]` - 刪除訂單
- `POST /api/orders/[id]/lock` - 鎖定/解鎖訂單
- `POST /api/orders/[id]/verify-password` - 驗證訂單密碼
- `POST /api/orders/export` - 匯出訂單資料

### 配方庫
- `GET /api/recipes` - 取得配方清單
- `POST /api/recipes` - 創建新配方
- `GET /api/recipes/[id]` - 取得特定配方
- `PUT /api/recipes/[id]` - 更新配方
- `DELETE /api/recipes/[id]` - 刪除配方
- `POST /api/recipes/[id]/analyze-effects` - 分析配方功效
- `POST /api/recipes/batch-analyze-effects` - 批量分析配方功效
- `POST /api/recipes/from-order/[orderId]` - 從訂單創建配方

### AI 功能
- `POST /api/ai/chat` - Smart AI 聊天（DeepSeek Chat v3.1）
- `POST /api/ai/marketing-analyze` - 行銷設計分析（DeepSeek Chat v3.1）
- `POST /api/ai/granulation-analyze` - 顆粒分析（GPT-5 + Claude + Grok 4）
- `POST /api/ai/granulation-consensus` - 顆粒分析共識（Claude Sonnet 4.5）
- `POST /api/ai/recipe-generate` - AI 配方生成（多模型）
- `POST /api/ai/recipe-chat` - 配方聊天（GPT-5 Mini）
- `POST /api/ai/ingredient-analysis` - 原料分析
- `POST /api/ai/price-analysis` - 價格分析
- `POST /api/ai/assess-risk` - 風險評估
- `POST /api/ai/translate` - AI 翻譯
- `POST /api/ai/label/generate` - AI 標籤生成
- `POST /api/ai/packaging-image` - 包裝圖像生成

## 測試

```bash
# 執行單元測試
npm test

# 執行 E2E 測試
npm run test:e2e
```

## 功能說明

### 配方建檔
- 支援動態新增/刪除原料條目
- 即時驗證原料品名唯一性
- 自動計算單粒總重量和批次總重量
- 智慧單位轉換顯示

### 生產記錄管理
- 多維度搜尋篩選（客戶名稱、產品代號、日期範圍、生產狀態）
- 分頁顯示與排序功能
- 詳細記錄檢視與編輯
- 一鍵匯出 CSV 格式

### 資料驗證
- 客戶名稱：1-100 字
- 產品代號：1-100 字
- 生產數量：1-5,000,000 粒
- 原料品名：1-100 字，支援中英數、括號、連字符
- 單粒含量：0.00001-10,000 mg，精度至小數點後 5 位

## 授權

MIT License

## 支援

如有問題或建議，請聯繫開發團隊。
