import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Card - 統一的卡片組件
 * 符合 Apple Human Interface Guidelines 標準
 * 所有卡片使用此組件，確保視覺一致性
 */

type CardVariant = 
  | 'default'    // 標準卡片
  | 'elevated'   // 提升卡片（更強陰影）
  | 'flat'       // 扁平卡片（無陰影）
  | 'glass'      // 玻璃擬態卡片（預設）
  | 'modal'      // 模態對話框（強背景）
  | 'dropdown'   // 下拉選單（輕量）
  | 'toast'      // 通知提示（優化）
  | 'tooltip'    // 工具提示（最小化）
  | 'table'      // 表格容器（特殊圓角）

type CardTone = "default" | "positive" | "caution" | "negative" | "neutral" | "info"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 視覺變體
   */
  variant?: CardVariant
  
  /**
   * 色調（保留向後兼容）
   */
  tone?: CardTone
  
  /**
   * 是否可互動（hover/active 效果）
   */
  interactive?: boolean
  
  /**
   * 是否使用 Apple 標準圓角
   */
  appleStyle?: boolean
}

// 變體樣式映射
const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white dark:bg-elevation-1 border border-neutral-200 dark:border-white/10 shadow-apple-md',
  elevated: 'bg-white dark:bg-elevation-2 border border-neutral-200 dark:border-white/10 shadow-apple-lg',
  flat: 'bg-white dark:bg-elevation-1 border border-neutral-200 dark:border-white/10 shadow-none',
  glass: 'liquid-glass-card liquid-glass-card-elevated',
  modal: 'liquid-glass-modal',
  dropdown: 'liquid-glass-dropdown',
  toast: 'liquid-glass-toast',
  tooltip: 'liquid-glass-tooltip',
  table: 'liquid-glass-table',
}

const Card = React.forwardRef<HTMLDivElement, CardProps>((
  {
    className,
    variant = 'glass',  // 預設使用 glass（保持現有風格）
    tone = "default",
    interactive = true,
    appleStyle = false,
    children,
    ...props
  },
  ref
) => {
  return (
    <div
      ref={ref}
      className={cn(
        // 基礎樣式
        'overflow-hidden',
        appleStyle ? 'rounded-apple-md' : '',
        // 變體樣式
        variant === 'glass' 
          ? cn(
              'liquid-glass-card liquid-glass-card-elevated',
              interactive && 'liquid-glass-card-interactive liquid-glass-card-refraction'
            )
          : variantStyles[variant],
        // 互動效果（Apple 標準）
        interactive && variant !== 'glass' && cn(
          'transition-all duration-300 ease-apple',
          'hover:shadow-apple-xl hover:-translate-y-0.5',
          'active:scale-[0.99]',
          'cursor-pointer'
        ),
        // 色調（向後兼容）
        tone !== "default" && `liquid-glass-tone-${tone}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
Card.displayName = "Card"

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-2 p-6",
        "liquid-glass-content", // 保留現有 glass 樣式
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight",
      "text-neutral-800 dark:text-white/95",
      "tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-neutral-600 dark:text-white/75",
      "leading-relaxed",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-6 pt-0",
      "liquid-glass-content", // 保留現有 glass 樣式
      className
    )}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      "liquid-glass-content", // 保留現有 glass 樣式
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

/**
 * 使用範例：
 * 
 * // Glass 風格（預設）
 * <Card>
 *   <CardHeader>
 *     <CardTitle>標題</CardTitle>
 *     <CardDescription>描述</CardDescription>
 *   </CardHeader>
 *   <CardContent>內容</CardContent>
 * </Card>
 * 
 * // Apple 標準風格
 * <Card variant="elevated" appleStyle interactive>
 *   內容
 * </Card>
 * 
 * // 模態對話框
 * <Card variant="modal">對話框內容</Card>
 * 
 * // 下拉選單
 * <Card variant="dropdown">選單項目</Card>
 * 
 * // 通知提示
 * <Card variant="toast">提示訊息</Card>
 * 
 * // 工具提示
 * <Card variant="tooltip">提示文字</Card>
 * 
 * // 表格容器
 * <Card variant="table">
 *   <table>...</table>
 * </Card>
 */
