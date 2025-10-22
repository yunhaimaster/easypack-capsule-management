# Quick Start Guide

一頁快速開始指南，適合有經驗的開發者。

## 🚀 5 分鐘設置

```bash
# 1. Clone 項目
git clone https://github.com/yunhaimaster/easypack-capsule-management.git
cd easypack-capsule-management

# 2. 安裝依賴
npm install

# 3. 設置環境變量
cp .env.example .env.local
# 編輯 .env.local 填入必要的值

# 4. 初始化數據庫
npx prisma generate
npx prisma migrate dev

# 5. 啟動開發服務器
npm run dev
# 打開 http://localhost:3000
```

---

## ⚠️ 最重要的規則

### **在 Commit 前必須 Build**

```bash
# ❌ 錯誤流程
git add -A
git commit -m "message"
git push

# ✅ 正確流程
npm run build  # ← 必須先 build！
git add -A
git commit -m "message"
git push
```

**為什麼？**
- Build 會檢查 TypeScript 錯誤
- 確保代碼能在生產環境運行
- Vercel 部署時如果 build 失敗會被取消

---

## 📝 Commit Message 格式

```bash
✨ feat: add new feature
🐛 fix: resolve bug
♻️ refactor: improve code structure
📝 docs: update documentation
🎨 style: improve UI/UX
⚡ perf: optimize performance
✅ test: add tests
```

---

## 🔥 常用命令

```bash
# 開發
npm run dev          # 啟動開發服務器
npm run build        # Build 生產版本（重要！）
npm run lint         # 檢查代碼風格

# 數據庫
npx prisma generate  # 生成 Prisma Client
npx prisma migrate dev  # 運行遷移
npx prisma studio    # 打開數據庫 GUI

# Git
git status           # 查看修改狀態
git add -A           # 暫存所有修改
git commit -m "msg"  # 提交
git push origin main # 推送到 GitHub
git pull origin main # 拉取最新代碼
```

---

## 🚨 常見錯誤

### Build 失敗
```bash
# 嘗試以下步驟
npm install          # 更新依賴
npx tsc --noEmit     # 檢查類型錯誤
npm run lint -- --fix  # 自動修復 lint 錯誤
```

### 端口被占用
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# 或使用不同端口
npm run dev -- -p 3001
```

### Git Push 被拒絕
```bash
git pull origin main  # 先拉取更新
# 解決衝突後
git push origin main
```

---

## 📚 更多資訊

詳細指南請參考：
- [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) - 完整開發設置指南
- [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) - 設計系統指南
- [README.md](./README.md) - 項目介紹

---

**記住：Always build before pushing!** 🚀

