# 數據庫遷移修復指南

## 問題描述

Vercel 部署失敗，錯誤信息：
```
Error: P3009
migrate found failed migrations in the target database
The `20251020233411_add_ingredient_search_optimization` migration failed
```

## 原因

遷移 `20251020233411_add_ingredient_search_optimization` 試圖創建 GIN 索引，但在生產數據庫上失敗了。
可能原因：
1. PostgreSQL 版本不支持某些索引類型
2. 數據庫權限不足
3. 表中的現有數據導致索引創建失敗

## 解決方案

### 方案 A：本地修復（推薦）

1. **標記失敗的遷移為已回滾**
   ```bash
   # 連接到 Vercel PostgreSQL 數據庫
   # 在 Vercel Dashboard 中找到數據庫連接字符串
   
   # 運行 Prisma 命令標記遷移為已回滾
   npx prisma migrate resolve --rolled-back 20251020233411_add_ingredient_search_optimization
   ```

2. **推送新的代碼（已刪除失敗的遷移）**
   ```bash
   git add -A
   git commit -m "fix: 刪除失敗的數據庫遷移"
   git push origin main
   ```

3. **Vercel 會自動重新部署，這次應該成功**

### 方案 B：直接 SQL 修復

如果方案 A 不工作，可以直接在 Vercel 數據庫中執行：

```sql
-- 連接到 Vercel PostgreSQL 數據庫後執行
UPDATE "_prisma_migrations"
SET finished_at = NOW(),
    rolled_back_at = NOW()
WHERE migration_name = '20251020233411_add_ingredient_search_optimization'
AND finished_at IS NULL;
```

然後推送代碼重新部署。

### 方案 C：重置遷移歷史（謹慎使用）

⚠️ **警告**：只在開發/測試環境使用，不要在生產環境使用！

```bash
# 刪除遷移歷史（會丟失數據）
npx prisma migrate reset

# 重新創建所有遷移
npx prisma migrate deploy
```

## 當前狀態

✅ **已完成**：
- 刪除失敗的遷移文件 `20251020233411_add_ingredient_search_optimization`
- 原料搜索功能已改為內存過濾（不再需要 GIN 索引）

⏳ **待執行**：
- 在生產數據庫上標記失敗的遷移為已回滾（方案 A 或 B）

## 為什麼刪除遷移是安全的

1. **功能已改為內存過濾**：不再需要 GIN 索引
2. **不影響現有數據**：該遷移只創建索引，不修改數據
3. **架構保持一致**：其他遷移已正確應用

## 預防未來問題

1. **測試遷移**：在部署前在暫存環境測試
2. **檢查索引**：確認數據庫版本支持所需索引類型
3. **備份優先**：在生產環境應用遷移前備份數據庫
4. **漸進式部署**：使用 Vercel 的預覽部署測試遷移

## 驗證修復

修復後，檢查：
1. ✅ Vercel 部署成功（無 P3009 錯誤）
2. ✅ 應用正常運行
3. ✅ 原料搜索功能正常
4. ✅ 其他功能不受影響

## 快速執行步驟

```bash
# 1. 在本地已完成（遷移已刪除）
git status  # 確認變更

# 2. 連接到 Vercel 數據庫（從 Vercel Dashboard 獲取連接字符串）
# 方案 A
npx prisma migrate resolve --rolled-back 20251020233411_add_ingredient_search_optimization

# 或方案 B（如果 A 不工作）
# 在數據庫客戶端執行 SQL（見上文）

# 3. 提交並推送
git add -A
git commit -m "fix: 刪除失敗的數據庫遷移"
git push origin main

# 4. 等待 Vercel 自動部署
# 5. 驗證部署成功
```

---

**需要幫助？**
- Prisma 遷移文檔：https://www.prisma.io/docs/concepts/components/prisma-migrate
- Vercel PostgreSQL：https://vercel.com/docs/storage/vercel-postgres

