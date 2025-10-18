# PostgreSQL 專用配置指南

## 🎯 目標
將項目完全轉換為 PostgreSQL 專用配置，避免 SQLite 和 PostgreSQL 之間的配置衝突。

## 📋 步驟

### 1. 環境變量配置
創建 `.env` 文件（替換現有的）：

```bash
# PostgreSQL Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/capsuledb"

# App Configuration
NEXT_PUBLIC_APP_NAME="EasyPack 膠囊配方管理系統"
NEXT_PUBLIC_APP_VERSION="2.0.0"

# API Configuration
NEXT_PUBLIC_APP_URL="https://easypack-capsule-management.vercel.app"
OPENROUTER_API_URL="https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY="your_openrouter_api_key"

# Production Settings
NODE_ENV="production"
```

### 2. 本地 PostgreSQL 設置

#### 選項 A: 使用 Docker (推薦)
```bash
# 創建 docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: capsuledb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

啟動：
```bash
docker-compose up -d
```

#### 選項 B: 本地安裝 PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# 創建數據庫
createdb capsuledb
```

#### 選項 C: 使用雲端 PostgreSQL (免費)
推薦使用以下服務：
- **Supabase** (免費 500MB)
- **Railway** (免費 $5 額度)
- **Neon** (免費 3GB)

### 3. 數據庫遷移
```bash
# 生成 Prisma 客戶端
npx prisma generate

# 運行數據庫遷移
npx prisma migrate deploy

# 或者重置數據庫（開發環境）
npx prisma migrate reset
```

### 4. Vercel 配置
在 Vercel 項目設置中添加環境變量：

```
DATABASE_URL=postgresql://username:password@host:port/database
OPENROUTER_API_KEY=your_openrouter_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 5. 驗證配置
```bash
# 測試數據庫連接
npx prisma db pull

# 測試構建
npm run build

# 測試開發服務器
npm run dev
```

## 🔧 已完成的修復

### Prisma Schema
✅ 已設置為 `provider = "postgresql"`

### API 路由修復
✅ 已修復以下文件以支持 PostgreSQL：
- `src/app/api/ai/price-analysis/route.ts`
- `src/app/api/database/recipes/route.ts`

### 搜索功能
✅ 已添加 `mode: 'insensitive'` 支持 PostgreSQL 大小寫不敏感搜索

## 🎯 優勢

1. **統一環境**: 本地和生產環境使用相同的數據庫類型
2. **避免衝突**: 不再有 SQLite/PostgreSQL 配置切換問題
3. **生產就緒**: 直接對應 Vercel 的 PostgreSQL 要求
4. **性能更好**: PostgreSQL 在生產環境中性能更佳
5. **功能豐富**: 支持更複雜的查詢和數據類型

## 📊 測試清單

部署前測試：
- [ ] 本地 PostgreSQL 連接正常
- [ ] 數據庫遷移成功
- [ ] 構建無錯誤
- [ ] 所有 v2.0 功能正常
- [ ] Vercel 環境變量設置正確

## 🚀 部署步驟

1. 設置本地 PostgreSQL 數據庫
2. 更新 `.env` 文件
3. 運行 `npx prisma migrate deploy`
4. 測試 `npm run build`
5. 推送代碼到 GitHub
6. Vercel 自動部署

## ⚠️ 注意事項

- 確保 PostgreSQL 服務正在運行
- 檢查數據庫連接字符串格式正確
- 備份現有數據（如果有的話）
- 測試所有 v2.0 功能是否正常
