# 開發環境設置指南 (Development Setup Guide)

這是 Easy Health 膠囊管理系統的完整開發環境設置和 Git 工作流程指南。

## 📋 目錄

- [前置要求](#前置要求)
- [初次設置](#初次設置)
- [日常開發流程](#日常開發流程)
- [Build 和測試](#build-和測試)
- [Git 工作流程](#git-工作流程)
- [常見問題排解](#常見問題排解)
- [最佳實踐](#最佳實踐)

---

## 前置要求

### 必須安裝的軟件

1. **Node.js** (v18 或更高版本)
   ```bash
   # 檢查 Node.js 版本
   node --version
   # 應該顯示 v18.x.x 或更高
   ```

2. **npm** (通常隨 Node.js 一起安裝)
   ```bash
   # 檢查 npm 版本
   npm --version
   # 應該顯示 9.x.x 或更高
   ```

3. **Git**
   ```bash
   # 檢查 Git 版本
   git --version
   # 應該顯示 git version 2.x.x 或更高
   ```

4. **代碼編輯器** (推薦 VS Code)

---

## 初次設置

### 1. Clone Repository

```bash
# Clone 項目到本地
git clone https://github.com/yunhaimaster/easypack-capsule-management.git

# 進入項目目錄
cd easypack-capsule-management
```

### 2. 安裝依賴

```bash
# 安裝所有 npm 套件
npm install

# 等待安裝完成（可能需要幾分鐘）
```

### 3. 設置環境變量

```bash
# 複製環境變量模板
cp .env.example .env.local

# 編輯 .env.local 文件，填入必要的環境變量
```

**重要環境變量**：
```env
# .env.local
LOGIN=2356                          # 登入密碼
DATABASE_URL=your_database_url      # 數據庫連接字符串
OPENROUTER_API_KEY=your_api_key     # OpenRouter API Key
```

⚠️ **重要**：`.env.local` 不會被提交到 Git（已在 .gitignore 中）

### 4. 初始化數據庫

```bash
# 生成 Prisma Client
npx prisma generate

# 運行數據庫遷移
npx prisma migrate dev

# (可選) 查看數據庫
npx prisma studio
```

### 5. 驗證設置

```bash
# 運行開發服務器
npm run dev

# 打開瀏覽器訪問 http://localhost:3000
# 如果能看到登入頁面，說明設置成功！
```

---

## 日常開發流程

### 1. 開始工作前

```bash
# 確保在 main 分支
git checkout main

# 拉取最新代碼
git pull origin main

# 更新依賴（如果有變化）
npm install
```

### 2. 啟動開發服務器

```bash
# 啟動 Next.js 開發服務器
npm run dev

# 服務器會在 http://localhost:3000 運行
# 支持熱重載（修改代碼會自動刷新）
```

### 3. 進行開發

- 修改代碼
- 在瀏覽器中測試
- 檢查控制台錯誤

---

## Build 和測試

### ⚠️ 重要：在 Commit 前必須 Build 測試

**規則**：在每次 `git commit` 或 `git push` 前，**必須**運行 build 測試。

### Build 測試流程

```bash
# 1. 運行 build 命令
npm run build

# 2. 檢查輸出
# ✅ 成功的輸出應該是：
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (X/X)
✓ Finalizing page optimization

# ❌ 如果看到錯誤，必須先修復才能 commit
```

### 常見 Build 錯誤

#### 1. TypeScript 類型錯誤

```bash
# 錯誤示例
Type error: Property 'foo' does not exist on type 'Bar'

# 解決方法
# - 檢查類型定義
# - 確保 import 正確
# - 修復類型不匹配
```

#### 2. 缺少 Import

```bash
# 錯誤示例
'IconContainer' is not defined

# 解決方法
# 在文件頂部添加 import
import { IconContainer } from '@/components/ui/icon-container'
```

#### 3. Linting 錯誤

```bash
# 運行 linter 檢查
npm run lint

# 自動修復（如果可能）
npm run lint -- --fix
```

---

## Git 工作流程

### 基本流程

```bash
# 1. 確保在最新的 main 分支
git checkout main
git pull origin main

# 2. 進行修改
# ... 編輯代碼 ...

# 3. **重要** 運行 build 測試
npm run build

# 4. 如果 build 成功，暫存修改
git add -A

# 5. 檢查要提交的文件
git status

# 6. 提交修改（使用描述性的提交信息）
git commit -m "✨ feat: add new feature X"

# 7. 推送到 GitHub
git push origin main
```

### Commit Message 格式

使用約定式提交格式：

```bash
# 新功能
git commit -m "✨ feat: add AI-powered recipe search"

# 修復 Bug
git commit -m "🐛 fix: resolve authentication timeout issue"

# 重構
git commit -m "♻️ refactor: unify card component variants"

# 文檔
git commit -m "📝 docs: update API documentation"

# 樣式/UI
git commit -m "🎨 style: improve homepage layout"

# 性能優化
git commit -m "⚡ perf: optimize database queries"

# 測試
git commit -m "✅ test: add E2E tests for login flow"
```

### 多行 Commit Message

對於複雜的修改：

```bash
git commit -m "✨ feat: 實現 AI 圖像生成功能

✨ 核心改進：
- 整合 Doubao SeeDream 4.0 API
- 新增 5 種圖像類型生成
- 實現 Prompt 提取邏輯

🔧 技術更新：
- 使用明確分隔符提升可靠性
- 添加圖像緩存機制

✅ Build 測試：通過"
```

---

## 常見問題排解

### 問題 1: Build 失敗

```bash
# 錯誤：Module not found
npm install

# 錯誤：TypeScript errors
# 檢查並修復類型錯誤

# 錯誤：Out of memory
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### 問題 2: Git Push 被拒絕

```bash
# 錯誤：! [rejected] main -> main (fetch first)

# 解決方法：先拉取遠程更改
git pull origin main

# 如果有衝突，解決衝突後
git add -A
git commit -m "🔀 merge: resolve conflicts"
git push origin main
```

### 問題 3: 數據庫錯誤

```bash
# 重置數據庫（⚠️ 會刪除所有數據）
npx prisma migrate reset

# 或者，只運行最新的遷移
npx prisma migrate deploy
```

### 問題 4: 端口被占用

```bash
# 錯誤：Port 3000 is already in use

# 解決方法 1：殺掉佔用端口的進程
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 解決方法 2：使用不同端口
npm run dev -- -p 3001
```

### 問題 5: npm install 失敗

```bash
# 清除緩存
npm cache clean --force

# 刪除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

---

## 最佳實踐

### ✅ DO（應該做的）

1. **Always build before commit**
   ```bash
   npm run build && git add -A && git commit -m "message"
   ```

2. **Write descriptive commit messages**
   ```bash
   # ✅ Good
   git commit -m "🐛 fix: resolve image generation prompt extraction error"
   
   # ❌ Bad
   git commit -m "fix"
   ```

3. **Keep commits focused**
   - 一個 commit 做一件事
   - 不要在一個 commit 中混合多個不相關的修改

4. **Pull before push**
   ```bash
   git pull origin main
   # ... resolve any conflicts ...
   git push origin main
   ```

5. **Test your changes**
   - 在瀏覽器中測試功能
   - 檢查不同屏幕尺寸
   - 測試錯誤情況

6. **Keep dependencies updated**
   ```bash
   # 定期檢查過時的套件
   npm outdated
   
   # 更新套件（小心破壞性變更）
   npm update
   ```

### ❌ DON'T（不應該做的）

1. **Don't commit without building**
   ```bash
   # ❌ Bad
   git add -A && git commit -m "message" && git push
   
   # ✅ Good
   npm run build && git add -A && git commit -m "message" && git push
   ```

2. **Don't commit sensitive data**
   - ❌ API keys
   - ❌ Passwords
   - ❌ `.env.local` file
   - ❌ Database credentials

3. **Don't force push to main**
   ```bash
   # ❌ Never do this
   git push --force origin main
   ```

4. **Don't commit broken code**
   - 確保代碼能運行
   - 確保 build 通過
   - 修復所有 linter 錯誤

5. **Don't skip dependency installation**
   ```bash
   # 當 package.json 改變時，總是運行
   npm install
   ```

---

## 開發工具配置

### VS Code 推薦擴展

在項目根目錄創建 `.vscode/extensions.json`：

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### VS Code 設置

在項目根目錄創建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## 緊急修復流程 (Hotfix)

如果生產環境出現緊急問題：

```bash
# 1. 快速類型檢查（不用完整 build）
npx tsc --noEmit

# 2. 修復問題

# 3. 再次檢查
npx tsc --noEmit

# 4. 提交並標記為 hotfix
git add -A
git commit -m "[HOTFIX] fix: critical production bug description"
git push origin main

# 5. 下次提交時運行完整 build
npm run build
```

⚠️ **警告**：Hotfix 流程僅用於生產環境緊急修復，日常開發必須運行完整 build！

---

## 團隊協作規範

### 代碼審查

如果團隊使用 Pull Request：

1. **創建功能分支**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **完成開發並測試**
   ```bash
   npm run build
   git add -A
   git commit -m "✨ feat: new feature"
   ```

3. **推送分支**
   ```bash
   git push origin feature/new-feature
   ```

4. **在 GitHub 創建 Pull Request**

5. **等待審查和合併**

### 代碼風格

- 使用 ESLint 和 Prettier
- 遵循項目的 TypeScript 規範
- 使用設計系統組件（不要硬編碼樣式）
- 遵循文件命名約定

---

## 性能優化

### Build 優化

```bash
# 分析 bundle 大小
npm run build
# 查看 First Load JS 大小

# 如果 bundle 過大
# - 使用動態 import
# - 優化圖片
# - 移除未使用的依賴
```

### 開發速度優化

```bash
# 使用 Turbopack (Next.js 14 實驗性功能)
npm run dev -- --turbo

# 或在 package.json 中設置
"dev": "next dev --turbo"
```

---

## 數據庫管理

### 創建新的遷移

```bash
# 修改 prisma/schema.prisma 後
npx prisma migrate dev --name description_of_change
```

### 查看數據庫

```bash
# 啟動 Prisma Studio
npx prisma studio

# 在瀏覽器打開 http://localhost:5555
```

### 重置數據庫（開發環境）

```bash
# ⚠️ 會刪除所有數據
npx prisma migrate reset
```

---

## 部署到 Vercel

### 首次部署

1. 在 Vercel 上連接 GitHub repository
2. 設置環境變量（在 Vercel Dashboard）
3. 點擊 Deploy

### 後續部署

```bash
# 每次 push 到 main 都會自動部署
git push origin main

# Vercel 會自動：
# 1. 運行 npm run build
# 2. 部署到生產環境
# 3. 如果 build 失敗，部署會被取消
```

---

## 參考資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Prisma 文檔](https://www.prisma.io/docs)
- [TypeScript 文檔](https://www.typescriptlang.org/docs)
- [Git 文檔](https://git-scm.com/doc)
- [項目設計系統](./docs/DESIGN_SYSTEM.md)

---

## 需要幫助？

如果遇到問題：

1. 檢查此文檔的「常見問題排解」部分
2. 查看項目的其他文檔（`docs/` 目錄）
3. 查看 GitHub Issues
4. 聯繫團隊成員

---

**最後更新**：2025-10-22
**維護者**：Easy Health Development Team

✅ **記住**：Always build before committing! 🚀

