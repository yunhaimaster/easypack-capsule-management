# 監控和錯誤追蹤設置指南

## 概述

本項目已配置基礎監控和錯誤追蹤功能，支持性能監控和錯誤追蹤。

---

## 🟢 已啟用功能

### 1. Vercel Analytics ✅

**狀態**: 已安裝並配置

**功能**:
- 自動頁面瀏覽追蹤
- Web Vitals 監控（CLS, FID, FCP, LCP, TTFB）
- 自動性能監控
- 實時流量分析

**配置位置**:
- `src/app/layout.tsx` - Analytics 組件已集成
- `src/lib/monitoring.ts` - 自定義事件追蹤

**使用方法**:
```typescript
import { trackEvent, trackPerformance } from '@/lib/monitoring'

// 追蹤自定義事件
trackEvent('order_created', {
  orderId: '123',
  value: 1000
})

// 追蹤性能
trackPerformance('api_fetch_orders', 250, 'ms')
```

**查看數據**:
訪問 Vercel Dashboard → Analytics

---

## 🟡 可選功能

### 2. Sentry 錯誤追蹤 (未啟用)

**狀態**: 配置文件已準備，需要安裝和啟用

**功能**:
- 自動錯誤捕獲
- 錯誤堆棧追蹤
- 性能監控
- Session Replay（可選）
- 用戶上下文追蹤

#### 啟用 Sentry

**步驟 1: 安裝**
```bash
npm install --save @sentry/nextjs
```

**步驟 2: 運行配置嚮導**
```bash
npx @sentry/wizard@latest -i nextjs
```

**步驟 3: 環境變數**

添加到 `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_auth_token_here
```

**步驟 4: 啟用配置**

編輯 `src/lib/sentry-config.ts`，取消註釋所有代碼。

**步驟 5: 初始化**

在 `src/app/layout.tsx` 中添加:
```typescript
import { initSentry } from '@/lib/sentry-config'

// 在組件外初始化
if (process.env.NODE_ENV === 'production') {
  initSentry()
}
```

**使用方法**:
```typescript
import { captureError, addBreadcrumb } from '@/lib/sentry-config'

try {
  // 你的代碼
} catch (error) {
  captureError(error as Error, {
    context: 'order_creation',
    userId: '123'
  })
}

// 添加追蹤路徑
addBreadcrumb('User clicked button', 'user_action', 'info', {
  buttonId: 'create-order'
})
```

---

## 📊 監控事件

### 預定義事件

`src/lib/monitoring.ts` 包含預定義的事件類型:

```typescript
import { MonitoringEvents } from '@/lib/monitoring'

// 訂單事件
trackEvent(MonitoringEvents.ORDER_CREATED, { orderId: '123' })
trackEvent(MonitoringEvents.ORDER_UPDATED, { orderId: '123' })
trackEvent(MonitoringEvents.ORDER_EXPORTED, { format: 'csv' })

// 配方事件
trackEvent(MonitoringEvents.RECIPE_CREATED, { recipeId: 'abc' })
trackEvent(MonitoringEvents.RECIPE_ANALYZED, { model: 'gpt-5' })

// AI 事件
trackEvent(MonitoringEvents.AI_CHAT_STARTED, { type: 'recipe' })
trackEvent(MonitoringEvents.AI_RECIPE_GENERATED, { duration: 5000 })

// 搜索事件
trackEvent(MonitoringEvents.SEARCH_PERFORMED, { keyword: 'vitamin' })
trackEvent(MonitoringEvents.FILTER_APPLIED, { filter: 'effect' })

// 認證事件
trackEvent(MonitoringEvents.LOGIN_SUCCESS)
trackEvent(MonitoringEvents.LOGIN_FAILED)
```

---

## 🎯 性能閾值

系統預定義了性能閾值（`PerformanceThresholds`）:

| 操作 | 閾值 | 說明 |
|-----|------|------|
| 頁面載入 | 3000ms | 首屏載入時間 |
| API 響應 | 1000ms | 一般 API 調用 |
| AI 響應 | 10000ms | AI 分析允許更長 |
| 搜索防抖 | 500ms | 搜索輸入延遲 |

超過閾值會自動記錄警告。

---

## 🔍 監控 API 調用

使用 `monitorApiCall` 自動追蹤 API 性能:

```typescript
import { monitorApiCall } from '@/lib/monitoring'

async function fetchOrders() {
  return monitorApiCall('fetchOrders', async () => {
    const response = await fetch('/api/orders')
    return response.json()
  })
}

// 自動記錄:
// - API 調用時間
// - 錯誤（如果發生）
// - 性能警告（如果超過閾值）
```

---

## 📈 Web Vitals

Vercel Analytics 自動追蹤以下指標:

| 指標 | 說明 | 良好標準 |
|-----|------|----------|
| **CLS** | 累積版面配置位移 | < 0.1 |
| **FID** | 首次輸入延遲 | < 100ms |
| **FCP** | 首次內容繪製 | < 1.8s |
| **LCP** | 最大內容繪製 | < 2.5s |
| **TTFB** | 首位元組時間 | < 600ms |

自定義 Web Vitals 報告:

```typescript
// src/app/layout.tsx
import { reportWebVitals } from '@/lib/monitoring'

export function reportWebVitals(metric) {
  // 自動發送到 Vercel Analytics
}
```

---

## 🛠️ 開發 vs 生產

### 開發環境
- 所有監控事件記錄到控制台
- 錯誤顯示詳細堆棧
- 不發送到外部服務

### 生產環境
- 事件發送到 Vercel Analytics
- 錯誤發送到 Sentry（如已啟用）
- 敏感數據自動過濾
- 性能數據收集

---

## 📝 最佳實踐

### 1. 追蹤關鍵用戶流程
```typescript
// 訂單創建流程
addBreadcrumb('Order form opened', 'navigation')
addBreadcrumb('Form data entered', 'user_action')
trackEvent(MonitoringEvents.ORDER_CREATED, { orderId })
addBreadcrumb('Order created successfully', 'success')
```

### 2. 監控 AI 調用
```typescript
const startTime = performance.now()

try {
  const result = await callAI(prompt)
  const duration = performance.now() - startTime
  
  trackPerformance('ai_chat', duration)
  trackEvent(MonitoringEvents.AI_CHAT_STARTED, {
    model: 'gpt-5-mini',
    duration
  })
} catch (error) {
  captureError(error as Error, {
    context: 'ai_chat',
    prompt: prompt.substring(0, 100) // 只記錄前100字符
  })
}
```

### 3. 過濾敏感數據
```typescript
// ❌ 不要記錄敏感數據
trackEvent('login', { password: '...' }) // 錯誤

// ✅ 只記錄非敏感信息
trackEvent('login', { userId: '123', success: true }) // 正確
```

### 4. 設置用戶上下文（如啟用 Sentry）
```typescript
import { setUserContext } from '@/lib/sentry-config'

// 登錄後設置
setUserContext('user-123', {
  role: 'admin',
  company: 'Easy Health'
})
```

---

## 🔧 配置文件

### 監控配置
- `src/lib/monitoring.ts` - 主監控邏輯
- `src/lib/sentry-config.ts` - Sentry 配置（可選）

### 組件
- `src/components/ui/performance-monitor.tsx` - 性能監控組件
- `src/components/ui/error-boundary.tsx` - 錯誤邊界

### 集成點
- `src/app/layout.tsx` - Analytics 初始化
- 各 API 路由 - 錯誤處理和追蹤

---

## 📊 查看監控數據

### Vercel Analytics
1. 登錄 Vercel Dashboard
2. 選擇項目
3. 點擊 "Analytics" 標籤
4. 查看:
   - 頁面瀏覽量
   - 獨立訪客
   - Web Vitals
   - 頁面性能

### Sentry（如已啟用）
1. 登錄 Sentry Dashboard
2. 查看:
   - 錯誤列表
   - 性能追蹤
   - Session Replays
   - 發布追蹤

---

## 🚀 快速開始

### 當前可用（無需額外配置）

```typescript
import { 
  trackEvent, 
  trackPerformance, 
  monitorApiCall,
  MonitoringEvents 
} from '@/lib/monitoring'

// 追蹤事件
trackEvent(MonitoringEvents.ORDER_CREATED, { orderId: '123' })

// 追蹤性能
trackPerformance('page_load', 1500)

// 監控 API
const data = await monitorApiCall('fetchData', () => fetch('/api/data'))
```

### 需要額外設置（Sentry）

1. 安裝 Sentry
2. 配置環境變數
3. 取消註釋配置文件
4. 重新部署

---

## 📧 支持

如有問題，請參考:
- [Vercel Analytics 文檔](https://vercel.com/analytics)
- [Sentry Next.js 文檔](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- 項目內部文檔: `docs/`

---

**監控配置完成！** ✅

當前已啟用 Vercel Analytics，可選擇性啟用 Sentry 以獲得更完整的錯誤追蹤功能。

