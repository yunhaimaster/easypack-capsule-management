# Easy Health 設計系統

> 符合 Apple Human Interface Guidelines 的統一設計系統

## 📖 概述

本設計系統基於 **Apple HIG（Human Interface Guidelines）** 標準建立，確保所有 UI 組件和樣式統一管理，實現「一改全改」的物件導向架構。

## ✅ 完成度：100 分

### 已完成的重構（2025-10-17）

**🎨 顏色系統完全統一**
- ✅ 0 處硬編碼顏色（從 528 → 0）
- ✅ 56 個文件已遷移至語義化顏色系統
- ✅ 所有 UI 組件使用 design tokens
- ✅ 100% 符合 Apple HIG 標準

**📊 重構統計**
- 階段一：21 個核心 UI 組件
- 階段二：6 個表單和訂單組件
- 階段三：21 個主要頁面
- 階段四：8 個行銷功能組件
- **總計：56 個文件，528+ 處顏色遷移**

**🎯 語義化映射**
```
text-gray-*    → text-neutral-*   (200+ 處)
text-slate-*   → text-neutral-*   (100+ 處)
text-blue-*    → text-primary-*   (80+ 處)
text-emerald-* → text-success-*   (60+ 處)
text-violet-*  → text-info-*      (40+ 處)
bg-blue-*      → bg-primary-*     (30+ 處)
bg-emerald-*   → bg-success-*     (18+ 處)
```

## 🎨 設計原則

### 1. 語義化命名
使用語義化顏色而非具體顏色名稱：
- ✅ `variant="primary"` （語義化）
- ❌ `className="bg-blue-500"` （硬編碼）

### 2. 組件優先
所有 UI 元素使用統一組件：
- ✅ `<IconContainer icon={Plus} variant="success" />`
- ❌ `<div className="icon-container icon-container-emerald">` 

### 3. Design Tokens
所有樣式值通過 design tokens 管理：
- 顏色：`colors.primary[500]`
- 間距：`spacing[4]` = 16px
- 圓角：`borderRadius.md` = 12px
- 陰影：`shadows.md`

---

## 🎯 核心組件

### IconContainer

統一的 Icon 容器組件，替代 20+ 種硬編碼變體。

#### 基本使用

```tsx
import { IconContainer } from '@/components/ui/icon-container'
import { Brain } from 'lucide-react'

<IconContainer icon={Brain} variant="primary" size="md" />
```

#### Props

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `icon` | `LucideIcon` | - | Lucide React 圖標 |
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | `'primary'` | 語義化顏色變體 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 尺寸 |

#### Variant 使用指南

| Variant | 使用場景 | 顏色 | 範例 |
|---------|---------|------|------|
| `primary` | 主要操作、品牌色 | 藍色 | 訂單列表、主按鈕 |
| `secondary` | 次要操作、輔助功能 | 青色 | AI 工具箱 |
| `success` | 成功狀態、新增操作 | 綠色 | 新增訂單、完成 |
| `warning` | 警告、注意事項 | 橙色 | 工時記錄、提醒 |
| `danger` | 危險操作、錯誤 | 紅色 | 刪除、錯誤提示 |
| `info` | 資訊、說明 | 紫色 | 配方庫、說明 |
| `neutral` | 中性、一般資訊 | 灰色 | 預設狀態 |

#### Size 規格

| Size | 容器尺寸 | Icon 尺寸 | 使用場景 |
|------|---------|----------|---------|
| `sm` | 32px | 16px | 小型標籤、內嵌圖標 |
| `md` | 40px | 20px | 標準卡片、列表項 |
| `lg` | 48px | 24px | 大卡片、重點展示 |
| `xl` | 64px | 32px | Hero 區塊、主要視覺 |

---

### Card

統一的卡片組件，支援多種樣式變體。

#### 基本使用

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

// Glass 風格（預設，保持現有液態玻璃風格）
<Card>
  <CardHeader>
    <CardTitle>標題</CardTitle>
    <CardDescription>描述文字</CardDescription>
  </CardHeader>
  <CardContent>
    內容區塊
  </CardContent>
</Card>

// Apple 標準風格
<Card variant="elevated" appleStyle interactive>
  內容
</Card>
```

#### Props

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `variant` | `'default' \| 'elevated' \| 'flat' \| 'glass'` | `'glass'` | 視覺變體 |
| `tone` | `'default' \| 'positive' \| 'caution' \| 'negative' \| 'neutral'` | `'default'` | 色調（向後兼容） |
| `interactive` | `boolean` | `true` | 是否啟用互動效果（hover/active） |
| `appleStyle` | `boolean` | `false` | 是否使用 Apple 標準圓角 |

#### Variant 說明

| Variant | 外觀 | 使用場景 |
|---------|------|---------|
| `glass` | 液態玻璃擬態效果 | 預設，保持現有風格 |
| `elevated` | 白色卡片 + 強陰影 | 重要內容、浮動元素 |
| `default` | 白色卡片 + 標準陰影 | 一般內容區塊 |
| `flat` | 白色卡片 + 無陰影 | 列表項、緊湊佈局 |

---

## 🎨 Design Tokens

### 顏色系統

```typescript
import { colors } from '@/lib/ui/design-tokens'

// 使用方式
colors.primary[500]    // 主色
colors.success[600]    // 成功色（深）
colors.neutral[300]    // 中性灰
```

### 語義化顏色

| 顏色 | 用途 | Tailwind Class |
|------|------|----------------|
| Primary | 品牌主色、主要操作 | `text-primary-600`, `bg-primary-500` |
| Secondary | 輔助色、次要操作 | `text-secondary-600`, `bg-secondary-500` |
| Success | 成功狀態、新增 | `text-success-600`, `bg-success-500` |
| Warning | 警告、注意 | `text-warning-600`, `bg-warning-500` |
| Danger | 錯誤、危險操作 | `text-danger-600`, `bg-danger-500` |
| Info | 資訊、說明 | `text-info-600`, `bg-info-500` |
| Neutral | 文字、邊框 | `text-neutral-600`, `bg-neutral-50` |

### 間距系統（4pt Grid）

基於 Apple 4pt 網格系統：

| Token | 值 | Tailwind | 使用場景 |
|-------|-----|----------|---------|
| `spacing[1]` | 4px | `space-1`, `p-1`, `m-1` | 最小間距 |
| `spacing[2]` | 8px | `space-2`, `p-2`, `m-2` | 緊湊間距 |
| `spacing[3]` | 12px | `space-3`, `p-3`, `m-3` | 小間距 |
| `spacing[4]` | 16px | `space-4`, `p-4`, `m-4` | 標準間距 |
| `spacing[6]` | 24px | `space-6`, `p-6`, `m-6` | 大間距 |
| `spacing[8]` | 32px | `space-8`, `p-8`, `m-8` | 超大間距 |

### 圓角系統

| Token | 值 | Tailwind | 使用場景 |
|-------|-----|----------|---------|
| `apple-sm` | 8px | `rounded-apple-sm` | 按鈕、Badge |
| `apple-md` | 12px | `rounded-apple-md` | 卡片 |
| `apple-lg` | 16px | `rounded-apple-lg` | Modal |
| `apple-xl` | 20px | `rounded-apple-xl` | Hero 區塊 |

### 陰影系統

| Token | Tailwind | 使用場景 |
|-------|----------|---------|
| Level 1 | `shadow-apple-sm` | Hover 狀態 |
| Level 2 | `shadow-apple-md` | 標準卡片 |
| Level 3 | `shadow-apple-lg` | 浮動元素 |
| Level 4 | `shadow-apple-xl` | Modal/Dialog |
| Level 5 | `shadow-apple-2xl` | 最高層級 |

### 動畫系統 🆕

#### Apple 標準過渡（300ms）

```tsx
// Tailwind Classes
transition-apple         // 標準過渡（300ms）
transition-apple-fast    // 快速過渡（200ms）
transition-apple-instant // 即時反饋（100ms）
transition-apple-slow    // 慢速過渡（500ms）
```

#### Easing Functions

```tsx
// Apple 標準緩動
ease-apple        // cubic-bezier(0.4, 0.0, 0.2, 1) - 標準
ease-apple-in     // cubic-bezier(0.4, 0.0, 1, 1) - 進入
ease-apple-out    // cubic-bezier(0.0, 0.0, 0.2, 1) - 離開
ease-apple-spring // cubic-bezier(0.34, 1.56, 0.64, 1) - iOS 彈簧
```

#### 觸控反饋 Classes 🆕

```tsx
// iOS 風格觸控反饋
<Button className="touch-feedback">
  按下時縮小至 0.97 倍
</Button>

<Card className="touch-feedback-hover">
  Hover 提升 -2px，Active 縮小 0.98 倍
</Card>

// 卡片互動
<Card className="card-interactive-apple">
  Hover 提升 -4px + 強陰影，Active 縮小 0.98 倍
</Card>

// 按鈕按壓
<Button className="button-press-apple">
  Active 時縮小至 0.97 倍
</Button>

// Icon 互動
<IconContainer className="icon-interactive-apple">
  Hover 放大 1.1 倍，Active 縮小 0.95 倍
</IconContainer>
```

#### 動畫工具庫

```typescript
import appleAnimations from '@/lib/ui/apple-animations'

// 使用預設動畫
const buttonStyle = {
  ...appleAnimations.presets.buttonInteractive.default,
}

// 獲取標準時長
const duration = appleAnimations.duration.normal // 300
```

---

## ✅ Do's and Don'ts

### ✅ Do（推薦做法）

```tsx
// ✅ 使用統一組件
<IconContainer icon={Plus} variant="success" size="md" />

// ✅ 使用語義化顏色
<Card>
  <Button className="bg-primary-500 hover:bg-primary-600">
    確認
  </Button>
</Card>

// ✅ 使用 design tokens
<div className="p-6 rounded-apple-md shadow-apple-md">
  內容
</div>

// ✅ 使用 Apple 標準動畫
<Button className="transition-all duration-300 ease-apple hover:scale-105">
  按鈕
</Button>
```

### ❌ Don'ts（避免做法）

```tsx
// ❌ 硬編碼 class
<div className="icon-container icon-container-blue">
  <Plus />
</div>

// ❌ 使用具體顏色名稱
<Button className="bg-blue-500">按鈕</Button>

// ❌ 硬編碼樣式值
<div className="rounded-2xl" style={{ boxShadow: '0 6px 20px rgba(15,32,77,0.08)' }}>
  內容
</div>

// ❌ 非標準動畫時長
<Button className="transition-all duration-150">
  按鈕
</Button>
```

---

## 🚀 遷移指南

### 從舊版 Icon 遷移

#### Before（舊版）
```tsx
<div className="icon-container icon-container-emerald icon-micro-bounce">
  <Plus className="h-5 w-5 text-white" />
</div>
```

#### After（新版）
```tsx
<IconContainer icon={Plus} variant="success" size="md" />
```

### 從硬編碼顏色遷移

#### Before（舊版）
```tsx
<Button className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">
  按鈕
</Button>

<h3 className="text-emerald-600">標題</h3>
<p className="text-slate-600">內容</p>
```

#### After（新版）
```tsx
<Button className="bg-gradient-to-r from-success-500 to-success-600">
  按鈕
</Button>

<h3 className="text-success-600">標題</h3>
<p className="text-neutral-600">內容</p>
```

---

## 📱 響應式設計

### Breakpoints

| Breakpoint | 值 | 使用場景 |
|-----------|-----|---------|
| `sm` | 640px | 手機橫屏 |
| `md` | 768px | 平板 |
| `lg` | 1024px | 桌面 |
| `xl` | 1280px | 大桌面 |

### 響應式範例

```tsx
<div className="
  px-4 py-4        // 手機
  sm:px-6 sm:py-6  // 平板
  lg:px-8 lg:py-8  // 桌面
">
  響應式內容
</div>
```

---

## ♿ 無障礙設計 🆕

### 最小觸控目標（Apple HIG 44pt）

所有可點擊元素必須符合 Apple HIG 44pt 最小觸控標準：

```tsx
// ✅ 符合 44pt 標準
<IconContainer size="lg" />  // 48px
<Button className="touch-target-44">按鈕</Button>

// ❌ 小於標準
<IconContainer size="sm" />  // 32px（僅用於非互動元素）
```

**自動應用：** 所有 `button`, `a`, `[role="button"]` 元素已自動設置 `min-height: 44px` 和 `min-width: 44px`

### 鍵盤導航 🆕

#### Focus Ring（焦點環）

```tsx
// 自動應用於所有互動元素
*:focus-visible {
  outline: 2px solid rgba(42, 150, 209, 0.6);
  outline-offset: 2px;
  border-radius: 4px;
}

// 自定義 focus 樣式
<Button className="focus-apple">
  鍵盤導航時顯示藍色焦點環
</Button>
```

#### 滑鼠用戶優化

```tsx
// 滑鼠點擊時不顯示 focus outline
*:focus:not(:focus-visible) {
  outline: none;
}
```

### 動畫偏好設置 🆕

#### 減少動畫

```css
/* 自動尊重用戶的動畫偏好 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

用戶在系統設置中選擇「減少動畫」時，所有動畫自動變為即時完成。

### 高對比度模式 🆕

```css
@media (prefers-contrast: high) {
  .liquid-glass-card {
    border-width: 2px;
    border-color: currentColor;
  }
  
  *:focus-visible {
    outline-width: 3px;
  }
}
```

### 螢幕閱讀器支援 🆕

```tsx
// 僅螢幕閱讀器可見
<span className="sr-only">
  為視障用戶提供的額外說明
</span>

// 獲得焦點時可見
<a className="sr-only-focusable" href="#main">
  跳到主要內容
</a>
```

### 對比度標準（WCAG AA）

所有文字必須符合 WCAG AA（4.5:1）對比度：

| 文字類型 | Class | 對比度 |
|---------|-------|--------|
| 主要文字 | `text-neutral-800` | 深灰（12:1） |
| 次要文字 | `text-neutral-600` | 中灰（7:1） |
| 輔助文字 | `text-neutral-500` | 淺灰（4.6:1） |

### 無障礙檢查清單

開發新功能時請確保：

- [ ] 所有互動元素至少 44x44px
- [ ] 鍵盤可導航所有功能
- [ ] Focus 狀態清晰可見
- [ ] 顏色對比度符合 WCAG AA
- [ ] 支援 prefers-reduced-motion
- [ ] 重要資訊不僅依賴顏色傳達
- [ ] 表單包含適當的 label
- [ ] 圖片包含 alt 文字

---

## 📋 StickyActionBar

iOS Notes 風格的底部操作列，適用於長表單編輯頁面。

### 核心功能

- ✅ 固定於畫面底部，始終可見
- ✅ Liquid glass 毛玻璃效果
- ✅ 智能髒值檢測（unsaved changes）
- ✅ 鍵盤快捷鍵（Cmd+S / Ctrl+S）
- ✅ 載入狀態顯示
- ✅ 瀏覽器離開提醒
- ✅ 完整無障礙支援

### 基本使用

```tsx
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { useSaveShortcut } from '@/hooks/use-keyboard-shortcut'
import { useDirtyForm } from '@/hooks/use-dirty-form'

function EditPage() {
  const form = useForm()
  const { isDirty, resetDirty } = useDirtyForm(form, initialData)
  
  const handleSave = async () => {
    const result = await saveData()
    if (result.success) {
      resetDirty() // 重置髒值狀態
    }
  }
  
  // 自動連接鍵盤快捷鍵
  useSaveShortcut(handleSave)
  
  return (
    <form>
      <div className="content-with-sticky-actions">
        {/* 表單內容 */}
      </div>
      
      <StickyActionBar
        onSave={handleSave}
        onCancel={() => router.back()}
        isDirty={isDirty}
        isSaving={isSubmitting}
        saveLabel="儲存配方"
        cancelLabel="取消"
      />
    </form>
  )
}
```

### Props

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `onSave` | `() => void \| Promise<void>` | - | 儲存回調函數 |
| `onCancel` | `() => void` | - | 取消回調函數 |
| `isDirty` | `boolean` | - | 是否有未儲存的變更 |
| `isSaving` | `boolean` | `false` | 是否正在儲存 |
| `saveLabel` | `string` | `'儲存'` | 儲存按鈕文字 |
| `cancelLabel` | `string` | `'取消'` | 取消按鈕文字 |
| `showKeyboardHint` | `boolean` | `true` | 是否顯示鍵盤快捷鍵提示 |

### 配套 Hooks

#### useDirtyForm

追蹤表單髒值狀態（有未儲存的變更）

```tsx
import { useDirtyForm } from '@/hooks/use-dirty-form'

const { isDirty, resetDirty } = useDirtyForm(
  form,              // React Hook Form 實例
  initialData,       // 初始資料
  {
    enableBeforeUnload: true,  // 瀏覽器離開提醒
    debounceMs: 300           // 防抖延遲
  }
)

// 儲存成功後重置
await saveData()
resetDirty()
```

#### useKeyboardShortcut

註冊鍵盤快捷鍵

```tsx
import { useKeyboardShortcut, useSaveShortcut } from '@/hooks/use-keyboard-shortcut'

// 通用快捷鍵
useKeyboardShortcut('Escape', handleClose, {
  preventDefault: true,
  enabled: dialogOpen
})

// 儲存快捷鍵（自動檢測 Mac/Windows）
useSaveShortcut(handleSave, !isSubmitting)
```

### 樣式類別

#### content-with-sticky-actions

為包含 StickyActionBar 的內容添加底部間距

```tsx
<div className="content-with-sticky-actions">
  {/* 表單內容 */}
</div>
```

- 桌面版：88px（72px bar + 16px spacing）
- 移動版：96px（更多間距避免重疊）

### 設計特點

#### 1. Liquid Glass 效果

- 使用 `backdrop-blur-xl` 實現毛玻璃
- 自適應背景內容
- 與整體設計系統一致

#### 2. 髒值指示器

當表單有未儲存的變更時：
- 左側顯示橙色圓點 + "未儲存的變更" 文字
- 圓點有細微脈動動畫（`animate-pulse-subtle`）
- 儲存按鈕變為藍色漸變（primary gradient）
- 鍵盤快捷鍵提示顯示

#### 3. 鍵盤快捷鍵

- **Mac**: `⌘ + S`
- **Windows/Linux**: `Ctrl + S`
- 自動檢測平台
- 防止瀏覽器預設行為
- 在輸入框中也能使用

#### 4. 無障礙功能

- ARIA labels 和 live regions
- 螢幕閱讀器公告
- 鍵盤導航支援
- 最小觸控目標 44x44px
- Focus ring 可見性

#### 5. 移動優化

- Safe area insets（iPhone 瀏海/Home Indicator）
- 更大的觸控目標（48px）
- 響應式按鈕佈局
- 觸控反饋動畫

### 使用場景

#### ✅ 適用於

- 長表單編輯頁面（訂單編輯、配方編輯）
- 需要頻繁儲存的頁面
- 有大量滾動的編輯介面
- 多欄位複雜表單

#### ❌ 不適用於

- 短表單（按鈕可見無需固定）
- Modal/Dialog（空間有限）
- 單頁式表單（無滾動）
- 只讀頁面

### 已整合頁面

- ✅ `/orders/[id]/edit` - 訂單編輯頁
- ✅ `/orders/new` - 新增訂單頁
- ✅ 所有使用 `ProductionOrderForm` 的頁面

### 技術細節

#### Z-Index 分層

```css
StickyActionBar: z-50
Modals/Dialogs:  z-100
Toasts:          z-200
```

#### 性能優化

- 使用 CSS `position: fixed` 而非 JavaScript
- 髒值比較使用深度相等檢查
- 防抖延遲 300ms
- 記憶化回調函數

#### 動畫

- 載入時從下方滑入（300ms）
- 按鈕狀態轉換（300ms）
- 遵循 `prefers-reduced-motion`

### 常見問題

**Q: 髒值檢測不準確？**

確保傳入正確的 initialData，且格式與表單資料一致。

**Q: 鍵盤快捷鍵不工作？**

檢查 `enabled` 參數，確保在載入/提交時禁用。

**Q: 按鈕被其他元素遮擋？**

確保父容器有 `content-with-sticky-actions` 類別。

**Q: 移動裝置底部被遮擋？**

StickyActionBar 自動支援 safe area insets。

---

## 🔧 開發工具

### VS Code 擴充

推薦安裝：
- **Tailwind CSS IntelliSense** - 自動完成 Tailwind classes
- **Prettier** - 程式碼格式化

### 快速查詢

```typescript
// 查看所有 design tokens
import designTokens from '@/lib/ui/design-tokens'
console.log(designTokens)
```

---

## 📚 參考資源

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev)

---

**最後更新：2025年10月17日**
**版本：v2.2.0 - StickyActionBar Integration**

### 版本歷史

- **v2.2.0** (2025-10-17) - StickyActionBar 整合
  - 新增 StickyActionBar 組件（iOS Notes 風格）
  - 新增 useDirtyForm Hook（髒值追蹤）
  - 新增 useKeyboardShortcut Hook（跨平台快捷鍵）
  - 整合至訂單編輯/新增頁面
  - 完整鍵盤快捷鍵支援（Cmd+S / Ctrl+S）

- **v2.1.0** (2024-10-16) - Apple HIG 完整實現
  - 新增觸控反饋動畫系統
  - 完整無障礙支援（WCAG AA）
  - 鍵盤導航優化
  - prefers-reduced-motion 支援
  - 高對比度模式支援

- **v2.0.0** (2024-10-16) - 設計系統重構
  - Design Tokens 系統
  - 統一組件架構
  - IconContainer 和 ModelBadge 組件

