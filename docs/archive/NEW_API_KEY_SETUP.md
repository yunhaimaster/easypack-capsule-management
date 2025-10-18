# 🔑 新 API 密鑰設置指南

## 問題說明
原本的 OpenRouter API 密鑰已在 Git 歷史中暴露，需要生成新的密鑰。

## 解決步驟

### 1. 生成新的 OpenRouter API 密鑰
1. 前往 https://openrouter.ai/
2. 登入您的帳戶
3. 前往 API Keys 頁面
4. 刪除舊的 API 密鑰（如果還存在）
5. 生成新的 API 密鑰
6. 複製新密鑰

### 2. 在 Vercel 中設置新密鑰
1. 登入 Vercel 控制台：https://vercel.com/dashboard
2. 選擇專案：`easypack-capsule-management`
3. 進入 **Settings > Environment Variables**
4. 刪除舊的 `OPENROUTER_API_KEY` 環境變數
5. 添加新的 `OPENROUTER_API_KEY` 環境變數，值為您剛生成的新密鑰

### 3. 環境變數設置
在 Vercel 中設置以下環境變數：

| 變數名稱 | 值 | 說明 |
|---------|-----|------|
| `OPENROUTER_API_KEY` | 您的新 API 密鑰 | 從 OpenRouter 生成的新密鑰 |
| `OPENROUTER_API_URL` | `https://openrouter.ai/api/v1/chat/completions` | OpenRouter API 端點 |
| `NEXT_PUBLIC_APP_URL` | `https://easypack-capsule-management.vercel.app` | 應用程式 URL |

### 4. 重新部署
設置完成後，Vercel 會自動重新部署。

## 安全最佳實踐

### ✅ 已實施
- 移除所有硬編碼的 API 密鑰
- 使用環境變數管理敏感信息
- 從本地環境變數文件中移除密鑰

### 🔄 建議
- 定期輪換 API 密鑰
- 不要在代碼中硬編碼任何密鑰
- 使用環境變數管理所有敏感信息

## 驗證設置
1. 檢查 Vercel 部署日誌，確認沒有 API 密鑰錯誤
2. 測試 AI 助手功能是否正常
3. 確認不再有安全警報

## 聯繫方式
如有問題，請聯繫 Victor（系統管理員）
