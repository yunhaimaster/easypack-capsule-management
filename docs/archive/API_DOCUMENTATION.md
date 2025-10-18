# 🔌 API 文檔

## 📋 目錄
1. [概述](#概述)
2. [認證](#認證)
3. [AI API](#ai-api)
4. [訂單 API](#訂單-api)
5. [原料 API](#原料-api)
6. [數據庫 API](#數據庫-api)
7. [錯誤處理](#錯誤處理)
8. [類型定義](#類型定義)

---

## 🌐 概述

### 基礎信息
- **Base URL**: `https://easypack-capsule-management.vercel.app`
- **API Version**: v1
- **Content Type**: `application/json`
- **語言**: 所有 API 回應使用香港書面語繁體中文

### 通用響應格式
```typescript
// 成功響應
{
  success: true,
  data: any,
  message?: string
}

// 錯誤響應
{
  success: false,
  error: string,
  details?: any
}
```

---

## 🔐 認證

### 認證方式
應用程式使用簡單的 localStorage 認證：
- `isAuthenticated`: 認證狀態
- `easypack_auth`: 認證標記

### 認證檢查
所有 API 端點都會檢查認證狀態，未認證的請求將返回 401 錯誤。

---

## 🤖 AI API

### `/api/ai/chat` - AI 聊天對話

#### 請求
```typescript
POST /api/ai/chat
Content-Type: application/json

{
  message: string,
  orders?: ProductionOrder[],
  context?: {
    currentPage: string,
    pageDescription: string,
    timestamp: string,
    ordersCount?: number,
    hasCurrentOrder?: boolean,
    currentOrder?: ProductionOrder
  },
  enableReasoning?: boolean
}
```

#### 響應
```typescript
// 流式響應 (Server-Sent Events)
data: {"type":"content","content":"AI 回應內容"}
data: {"type":"reasoning","reasoning":"AI 思考過程"}
data: {"type":"suggestions","suggestions":["建議問題1","建議問題2"]}
data: {"type":"done"}
```

#### 系統提示詞
AI 助手使用專業的膠囊灌裝專家身份，提供以下功能：
- 配方分析與建議
- 生產流程優化
- 風險評估
- 法規合規性檢查

#### 示例
```bash
curl -X POST https://easypack-capsule-management.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "請分析這個配方的風險",
    "orders": [...],
    "enableReasoning": false
  }'
```

### `/api/ai/parse-recipe` - AI 配方解析

#### 請求
```typescript
POST /api/ai/parse-recipe
Content-Type: application/json

{
  recipeText: string
}
```

#### 響應
```typescript
{
  success: true,
  data: {
    ingredients: Array<{
      materialName: string,
      unitContentMg: number,
      isCustomerProvided: boolean
    }>,
    totalWeight: number,
    analysis: string
  }
}
```

#### 示例
```bash
curl -X POST https://easypack-capsule-management.vercel.app/api/ai/parse-recipe \
  -H "Content-Type: application/json" \
  -d '{
    "recipeText": "維生素C 500mg, 維生素D3 1000IU, 鈣 200mg"
  }'
```

### `/api/ai/assess-risk` - AI 風險評估

#### 請求
```typescript
POST /api/ai/assess-risk
Content-Type: application/json

{
  materials: Array<{
    materialName: string,
    unitContentMg: number
  }>
}
```

#### 響應
```typescript
{
  success: true,
  data: {
    assessments: Array<{
      materialName: string,
      riskScore: number, // 1-10
      riskLevel: "低風險" | "中風險" | "高風險",
      riskReasons: string[],
      recommendations: string[],
      technicalNotes: string
    }>
  }
}
```

#### 評估標準
AI 使用 10 個專業標準進行評估：
1. 流動性 (Flowability)
2. 黏性 (Viscosity)
3. 密度 (Density)
4. 穩定性 (Stability)
5. 混合性 (Mixability)
6. 分離風險 (Segregation Risk)
7. 結塊風險 (Caking Risk)
8. 腐蝕性 (Corrosiveness)
9. 健康風險 (Health Risk)
10. 法規風險 (Regulatory Risk)

### `/api/ai/translate` - AI 翻譯

#### 請求
```typescript
POST /api/ai/translate
Content-Type: application/json

{
  text: string,
  targetLanguage: "zh-TW" | "en"
}
```

#### 響應
```typescript
{
  success: true,
  data: {
    translatedText: string,
    originalText: string,
    confidence: number
  }
}
```

---

## 📦 訂單 API

### `/api/orders` - 訂單管理

#### 獲取訂單列表
```typescript
GET /api/orders?page=1&limit=10&sortBy=createdAt&sortOrder=desc&customerName=客戶名稱&productName=產品名稱&ingredientName=原料名稱&capsuleType=膠囊類型
```

**查詢參數**:
- `page`: 頁碼 (預設: 1)
- `limit`: 每頁數量 (預設: 10, 最大: 100)
- `sortBy`: 排序字段 (createdAt, completionDate, customerName)
- `sortOrder`: 排序順序 (asc, desc)
- `customerName`: 客戶名稱篩選
- `productName`: 產品名稱篩選
- `ingredientName`: 原料名稱篩選
- `capsuleType`: 膠囊類型篩選

**響應**:
```typescript
{
  success: true,
  data: {
    orders: ProductionOrder[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }
}
```

#### 創建新訂單
```typescript
POST /api/orders
Content-Type: application/json

{
  customerName: string,
  productName: string,
  capsuleType: "明膠胃溶" | "植物胃溶" | "明膠腸溶" | "植物腸溶",
  capsuleColor: string,
  productionQuantity: number,
  completionDate?: string,
  processIssues?: string,
  qualityNotes?: string,
  ingredients: Array<{
    materialName: string,
    unitContentMg: number,
    isCustomerProvided: boolean
  }>
}
```

**響應**:
```typescript
{
  success: true,
  data: {
    order: ProductionOrder
  }
}
```

### `/api/orders/[id]` - 單個訂單操作

#### 獲取訂單詳情
```typescript
GET /api/orders/[id]
```

**響應**:
```typescript
{
  success: true,
  data: {
    order: ProductionOrder & {
      ingredients: Ingredient[]
    }
  }
}
```

#### 更新訂單
```typescript
PUT /api/orders/[id]
Content-Type: application/json

{
  // 與創建訂單相同的字段
}
```

#### 刪除訂單
```typescript
DELETE /api/orders/[id]
```

**響應**:
```typescript
{
  success: true,
  message: "訂單已成功刪除"
}
```

### `/api/orders/export` - 訂單導出

#### 導出訂單數據
```typescript
GET /api/orders/export?format=csv&filters={...}
```

**查詢參數**:
- `format`: 導出格式 (csv, json)
- `filters`: JSON 字符串，包含篩選條件

**響應**:
```typescript
// CSV 格式
Content-Type: text/csv
Content-Disposition: attachment; filename="orders.csv"

// JSON 格式
{
  success: true,
  data: {
    orders: ProductionOrder[],
    summary: {
      totalOrders: number,
      totalQuantity: number,
      dateRange: {
        start: string,
        end: string
      }
    }
  }
}
```

### `/api/orders/options` - 訂單選項

#### 獲取篩選選項
```typescript
GET /api/orders/options?customerName=客戶&productName=產品&ingredientName=原料&capsuleType=膠囊
```

**響應**:
```typescript
{
  success: true,
  data: {
    customerOptions: string[],
    productOptions: string[],
    ingredientOptions: string[],
    capsuleOptions: string[]
  }
}
```

---

## 🧪 原料 API

### `/api/ingredients/stats` - 原料統計

#### 獲取原料使用統計
```typescript
GET /api/ingredients/stats
```

**響應**:
```typescript
{
  success: true,
  data: {
    summary: {
      totalIngredients: number,
      highRiskIngredients: number,
      mediumRiskIngredients: number,
      lowRiskIngredients: number
    },
    ingredients: Array<{
      materialName: string,
      usageCount: number,
      totalQuantity: number,
      riskLevel: "高風險" | "中風險" | "低風險",
      riskScore: number,
      riskDescription: string,
      riskReasons?: string[],
      recommendations?: string[],
      isAIAssessed: boolean
    }>
  }
}
```

---

## 🗄️ 數據庫 API

### `/api/migrate` - 數據庫遷移

#### 執行數據庫遷移
```typescript
POST /api/migrate
```

**響應**:
```typescript
{
  success: true,
  message: "數據庫遷移完成",
  migrations: string[]
}
```

### `/api/test-db` - 數據庫測試

#### 測試數據庫連接
```typescript
GET /api/test-db
```

**響應**:
```typescript
{
  success: true,
  message: "數據庫連接正常",
  tables: string[],
  schema: any
}
```

---

## ❌ 錯誤處理

### HTTP 狀態碼
- `200`: 成功
- `400`: 請求參數錯誤
- `401`: 未認證
- `404`: 資源不存在
- `500`: 服務器內部錯誤

### 錯誤響應格式
```typescript
{
  success: false,
  error: string,
  details?: {
    code: string,
    message: string,
    field?: string
  }
}
```

### 常見錯誤

#### 認證錯誤
```typescript
{
  success: false,
  error: "未授權訪問",
  details: {
    code: "UNAUTHORIZED",
    message: "請先登入系統"
  }
}
```

#### 驗證錯誤
```typescript
{
  success: false,
  error: "輸入數據驗證失敗",
  details: {
    code: "VALIDATION_ERROR",
    message: "客戶名稱不能為空",
    field: "customerName"
  }
}
```

#### AI 服務錯誤
```typescript
{
  success: false,
  error: "AI 服務暫時無法回應",
  details: {
    code: "AI_SERVICE_ERROR",
    message: "請稍後再試或重試"
  }
}
```

---

## 📝 類型定義

### 核心類型
```typescript
interface ProductionOrder {
  id: string
  customerName: string
  productName: string
  capsuleType: "明膠胃溶" | "植物胃溶" | "明膠腸溶" | "植物腸溶"
  capsuleColor: string
  productionQuantity: number
  completionDate: Date | null
  processIssues: string | null
  qualityNotes: string | null
  createdAt: Date
  updatedAt: Date
}

interface Ingredient {
  id: string
  orderId: string
  materialName: string
  unitContentMg: number
  isCustomerProvided: boolean
}

interface OrderFilters {
  customerName?: string
  productName?: string
  ingredientName?: string
  capsuleType?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

interface AIResponse {
  content: string
  reasoning?: string
  suggestions?: string[]
}
```

### API 響應類型
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}
```

---

## 🔧 使用示例

### 前端 API 調用
```typescript
// 使用 fetch
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData)
})

const result = await response.json()

// 使用自定義 hook
const { data, loading, error } = useOrders()

// 使用 React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['orders'],
  queryFn: fetchOrders
})
```

### 錯誤處理
```typescript
try {
  const response = await fetch('/api/orders')
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'API 請求失敗')
  }
  
  const data = await response.json()
  return data
  
} catch (error) {
  console.error('API 錯誤:', error)
  // 顯示用戶友好的錯誤消息
  throw error
}
```

### AI 流式響應處理
```typescript
const handleAIResponse = async (message: string) => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    
    if (done) break
    
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        
        switch (data.type) {
          case 'content':
            setContent(prev => prev + data.content)
            break
          case 'reasoning':
            setReasoning(data.reasoning)
            break
          case 'suggestions':
            setSuggestions(data.suggestions)
            break
        }
      }
    }
  }
}
```

---

## 📊 性能指標

### 響應時間目標
- AI API: < 3 秒
- 訂單 API: < 500ms
- 統計 API: < 1 秒

### 限制
- 訂單列表: 最大 100 條/頁
- AI 對話: 最大 32000 tokens
- 文件上傳: 最大 10MB

---

*最後更新: 2025年9月30日*
