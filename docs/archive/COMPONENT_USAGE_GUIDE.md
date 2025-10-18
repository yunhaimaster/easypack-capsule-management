# 🧩 組件使用指南

## 📋 目錄
1. [基礎組件](#基礎組件)
2. [液態玻璃組件](#液態玻璃組件)
3. [AI 組件](#ai-組件)
4. [表單組件](#表單組件)
5. [佈局組件](#佈局組件)
6. [樣式類參考](#樣式類參考)
7. [最佳實踐](#最佳實踐)

---

## 🎯 基礎組件

### Button 組件
```typescript
import { Button } from '@/components/ui/button'

// 基礎使用
<Button>點擊我</Button>

// 不同變體
<Button variant="default">默認</Button>
<Button variant="outline">輪廓</Button>
<Button variant="destructive">危險</Button>
<Button variant="secondary">次要</Button>
<Button variant="ghost">幽靈</Button>
<Button variant="link">鏈接</Button>

// 不同尺寸
<Button size="sm">小</Button>
<Button size="default">默認</Button>
<Button size="lg">大</Button>
<Button size="icon">圖標</Button>

// 帶圖標
<Button>
  <Plus className="h-4 w-4 mr-2" />
  添加
</Button>
```

### Input 組件
```typescript
import { Input } from '@/components/ui/input'

// 基礎使用
<Input placeholder="請輸入..." />

// 不同類型
<Input type="text" placeholder="文本" />
<Input type="email" placeholder="郵箱" />
<Input type="password" placeholder="密碼" />
<Input type="number" placeholder="數字" />

// 帶標籤
<div className="space-y-2">
  <label className="text-sm font-medium">客戶名稱</label>
  <Input placeholder="請輸入客戶名稱" />
</div>
```

### Card 組件
```typescript
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <h3 className="text-lg font-semibold">標題</h3>
    <p className="text-sm text-gray-600">描述</p>
  </CardHeader>
  <CardContent>
    <p>卡片內容</p>
  </CardContent>
  <CardFooter>
    <Button>操作</Button>
  </CardFooter>
</Card>
```

---

## 💎 液態玻璃組件

### LiquidGlassModal
```typescript
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'

<LiquidGlassModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="模態框標題"
  size="md" // sm, md, lg, xl, full
  closeOnBackdropClick={true}
  closeOnEscape={true}
  animateFrom="center" // center, button
  headerButtons={
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4" />
    </Button>
  }
>
  <div>模態框內容</div>
</LiquidGlassModal>
```

### 液態玻璃卡片系統
```typescript
// 基礎卡片
<div className="liquid-glass-card">
  <div className="liquid-glass-content">
    <h3>標題</h3>
    <p>內容</p>
  </div>
</div>

// 品牌色卡片
<div className="liquid-glass-card liquid-glass-card-brand">
  <div className="liquid-glass-content">
    <h3>品牌卡片</h3>
    <p>使用品牌色的卡片</p>
  </div>
</div>

// 高級卡片
<div className="liquid-glass-card liquid-glass-card-elevated">
  <div className="liquid-glass-content">
    <h3>高級卡片</h3>
    <p>具有更高陰影效果的卡片</p>
  </div>
</div>

// 互動卡片
<div className="liquid-glass-card liquid-glass-card-interactive">
  <div className="liquid-glass-content">
    <h3>互動卡片</h3>
    <p>具有懸停效果的卡片</p>
  </div>
</div>

// 組合使用
<div className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-interactive liquid-glass-card-refraction">
  <div className="liquid-glass-content">
    <h3>組合卡片</h3>
    <p>結合多種效果的卡片</p>
  </div>
</div>
```

### 圖標容器系統
```typescript
// 基礎圖標容器
<div className="icon-container icon-container-blue">
  <Package className="h-4 w-4 text-white" />
</div>

// 不同顏色的圖標容器
<div className="icon-container icon-container-red">
  <AlertTriangle className="h-4 w-4 text-white" />
</div>

<div className="icon-container icon-container-green">
  <CheckCircle className="h-4 w-4 text-white" />
</div>

<div className="icon-container icon-container-yellow">
  <Warning className="h-4 w-4 text-white" />
</div>

// 在卡片中使用
<div className="liquid-glass-card">
  <div className="liquid-glass-content">
    <div className="flex items-center gap-3">
      <div className="icon-container icon-container-blue">
        <Package className="h-4 w-4 text-white" />
      </div>
      <div>
        <h3>標題</h3>
        <p>描述</p>
      </div>
    </div>
  </div>
</div>
```

---

## 🤖 AI 組件

### SmartAIAssistant
```typescript
import { SmartAIAssistant } from '@/components/ai/smart-ai-assistant'

<SmartAIAssistant
  orders={orders}
  currentOrder={currentOrder}
  pageData={{
    currentPage: '/orders',
    pageDescription: '訂單列表頁面',
    timestamp: new Date().toISOString()
  }}
  showOnPages={['/orders']} // 只在指定頁面顯示
/>
```

### OrderAIAssistant
```typescript
import { OrderAIAssistant } from '@/components/ai/order-ai-assistant'

<OrderAIAssistant
  order={order}
  onModalReplace={() => {/* 處理模態框替換 */}}
/>
```

### AI 思考指示器
```typescript
import { AIThinkingIndicator, AIThinkingSteps } from '@/components/ui/ai-thinking-indicator'

// 快速模式
<AIThinkingIndicator />

// 推理模式
<AIThinkingSteps />
```

### AI 免責聲明
```typescript
import { AIDisclaimer, AIDisclaimerCompact } from '@/components/ui/ai-disclaimer'

// 完整版本
<AIDisclaimer />

// 簡潔版本（用於模態框）
<AIDisclaimerCompact />
```

---

## 📝 表單組件

### ProductionOrderForm
```typescript
import { ProductionOrderForm } from '@/components/forms/production-order-form'

<ProductionOrderForm
  initialData={orderData}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isEditing={false}
/>
```

### LinkedFilter
```typescript
import { LinkedFilter } from '@/components/ui/linked-filter'

<LinkedFilter
  customerOptions={customerOptions}
  productOptions={productOptions}
  ingredientOptions={ingredientOptions}
  capsuleOptions={capsuleOptions}
  onSearch={handleSearch}
  onExport={handleExport}
  loading={isLoading}
/>
```

---

## 🏗️ 佈局組件

### LiquidGlassNav
```typescript
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'

<LiquidGlassNav
  brandName="Easy Health"
  brandSubtitle="膠囊配方管理系統"
  links={[
    { href: '/', label: '首頁', icon: Home },
    { href: '/orders', label: '訂單', icon: Package },
    { href: '/orders/new', label: '新建', icon: Plus },
    { href: '/reports', label: '報表', icon: BarChart3 }
  ]}
/>
```

### LiquidGlassHero
```typescript
import { LiquidGlassHero } from '@/components/ui/liquid-glass-hero'

<LiquidGlassHero
  title="歡迎使用 Easy Health"
  subtitle="膠囊配方管理系統"
  description="專業的膠囊生產管理解決方案"
  icon={<Package className="h-8 w-8" />}
  gradient="blue"
  actions={
    <>
      <Button>開始使用</Button>
      <Button variant="outline">了解更多</Button>
    </>
  }
/>
```

### 頁面佈局模板
```typescript
// 標準頁面佈局
export default function MyPage() {
  return (
    <div className="min-h-screen brand-logo-pattern-bg">
      <div className="page-content-spacing">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 頁面標題 */}
          <LiquidGlassHero
            title="頁面標題"
            description="頁面描述"
            icon={<Icon className="h-8 w-8" />}
          />
          
          {/* 內容卡片 */}
          <div className="liquid-glass-card">
            <div className="liquid-glass-content">
              <h2 className="text-xl font-semibold mb-4">內容標題</h2>
              <p>內容...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 🎨 樣式類參考

### 響應式間距
```css
/* 頁面內容間距 */
.page-content-spacing

/* 卡片間距 */
.card-spacing
```

### 背景動畫
```css
/* 品牌 Logo 背景 */
.brand-logo-pattern-bg

/* 浮動形狀 */
.floating-shapes
.floating-orbs
.floating-dots
```

### 動畫效果
```css
/* 懸停效果 */
.liquid-glass-card:hover
.liquid-glass-card-interactive:hover

/* 折射效果 */
.liquid-glass-card-refraction:hover::before
```

### 響應式斷點
```css
/* 移動端 */
@media (max-width: 639px) { }

/* 平板 */
@media (min-width: 640px) { }

/* 桌面 */
@media (min-width: 768px) { }

/* 大桌面 */
@media (min-width: 1024px) { }

/* 5K 顯示器 */
@media (min-width: 2560px) { }
```

---

## ✨ 最佳實踐

### 組件組合
```typescript
// ✅ 正確：使用液態玻璃卡片系統
<div className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-interactive">
  <div className="liquid-glass-content">
    <div className="flex items-center gap-3 mb-4">
      <div className="icon-container icon-container-blue">
        <Package className="h-4 w-4 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">標題</h3>
        <p className="text-sm text-gray-600">描述</p>
      </div>
    </div>
    <p>內容...</p>
  </div>
</div>

// ❌ 錯誤：混用不同卡片系統
<Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
  {/* 內容 */}
</Card>
```

### 響應式設計
```typescript
// ✅ 正確：使用響應式類
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  <div className="liquid-glass-card">
    {/* 內容 */}
  </div>
</div>

// ❌ 錯誤：固定尺寸
<div className="grid grid-cols-4 gap-4">
  <div className="liquid-glass-card">
    {/* 內容 */}
  </div>
</div>
```

### 圖標使用
```typescript
// ✅ 正確：使用統一的圖標容器
<div className="icon-container icon-container-blue">
  <Package className="h-4 w-4 text-white" />
</div>

// ❌ 錯誤：自定義樣式
<div className="p-2 bg-blue-500 rounded-lg">
  <Package className="h-4 w-4 text-white" />
</div>
```

### 狀態管理
```typescript
// ✅ 正確：使用適當的 hooks
const [isOpen, setIsOpen] = useState(false)
const [loading, setLoading] = useState(false)

// 使用自定義 hook
const { messages, input, handleSendMessage } = useAIAssistant({
  orders,
  context: pageData
})
```

### 錯誤處理
```typescript
// ✅ 正確：使用錯誤邊界和適當的錯誤處理
try {
  const response = await fetch('/api/orders')
  if (!response.ok) {
    throw new Error('API 請求失敗')
  }
  const data = await response.json()
} catch (error) {
  console.error('錯誤:', error)
  // 顯示用戶友好的錯誤消息
}
```

### 性能優化
```typescript
// ✅ 正確：使用 React 優化
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>
})

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

const handleClick = useCallback(() => {
  doSomething()
}, [dependency])
```

---

## 🔧 故障排除

### 常見問題

#### 樣式不生效
- 檢查是否使用了正確的 CSS 類名
- 確認 Tailwind CSS 已正確配置
- 檢查是否有樣式衝突

#### 組件不渲染
- 檢查 import 路徑是否正確
- 確認組件 props 類型是否匹配
- 檢查是否有 TypeScript 錯誤

#### 響應式問題
- 確認使用了正確的響應式類
- 檢查斷點是否正確
- 測試不同屏幕尺寸

#### AI 功能問題
- 檢查 API 密鑰是否正確配置
- 確認網絡連接正常
- 檢查控制台錯誤信息

### 調試技巧
```typescript
// 使用 React DevTools
// 檢查組件狀態和 props

// 使用瀏覽器開發者工具
// 檢查網絡請求和響應

// 使用 console.log 調試
console.log('調試信息:', data)

// 使用 React 的 StrictMode
// 幫助發現潛在問題
```

---

*最後更新: 2025年9月30日*
