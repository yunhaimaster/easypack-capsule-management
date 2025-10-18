import * as React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

/**
 * IconContainer - 統一的 Icon 容器組件
 * 符合 Apple Human Interface Guidelines 標準
 * 所有 icon 使用此組件，確保視覺一致性
 */

type IconVariant = 
  | 'primary'    // 藍色 - 主要操作
  | 'secondary'  // 青色 - 次要操作
  | 'success'    // 綠色 - 成功狀態
  | 'warning'    // 橙色 - 警告狀態
  | 'danger'     // 紅色 - 危險操作
  | 'info'       // 紫色 - 資訊提示
  | 'neutral'    // 灰色 - 中性

type IconSize = 'sm' | 'md' | 'lg' | 'xl'

interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Icon 組件（來自 lucide-react）
   */
  icon?: LucideIcon
  
  /**
   * 顏色變體（語義化命名）
   */
  variant?: IconVariant
  
  /**
   * 尺寸
   */
  size?: IconSize
  
  /**
   * 子元素（如果不使用 icon prop）
   */
  children?: React.ReactNode
}

// 顏色映射（使用 Tailwind 語義化顏色）
const variantStyles: Record<IconVariant, string> = {
  primary: 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-apple-md',
  secondary: 'bg-gradient-to-br from-secondary-400 to-secondary-600 shadow-apple-md',
  success: 'bg-gradient-to-br from-success-400 to-success-600 shadow-apple-md',
  warning: 'bg-gradient-to-br from-warning-400 to-warning-600 shadow-apple-md',
  danger: 'bg-gradient-to-br from-danger-400 to-danger-600 shadow-apple-md',
  info: 'bg-gradient-to-br from-info-400 to-info-600 shadow-apple-md',
  neutral: 'bg-gradient-to-br from-neutral-400 to-neutral-600 shadow-apple-md',
}

// 尺寸映射（符合 Apple 44pt 觸控標準）
const sizeStyles: Record<IconSize, { container: string; icon: string }> = {
  sm: {
    container: 'w-8 h-8 rounded-lg',    // 32px
    icon: 'w-4 h-4',                     // 16px icon
  },
  md: {
    container: 'w-10 h-10 rounded-xl',  // 40px
    icon: 'w-5 h-5',                     // 20px icon
  },
  lg: {
    container: 'w-12 h-12 rounded-xl',  // 48px (舒適觸控)
    icon: 'w-6 h-6',                     // 24px icon
  },
  xl: {
    container: 'w-16 h-16 rounded-2xl', // 64px
    icon: 'w-8 h-8',                     // 32px icon
  },
}

export const IconContainer = React.forwardRef<HTMLDivElement, IconContainerProps>(
  (
    {
      icon: Icon,
      variant = 'primary',
      size = 'md',
      className,
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
          'inline-flex items-center justify-center',
          'backdrop-blur-sm',
          'border border-white/40',
          'transition-all duration-300 ease-apple',
          // 陰影效果
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
          // Hover 效果
          'hover:scale-105 hover:shadow-apple-lg',
          // Active 效果（Apple 按壓）
          'active:scale-95',
          // 顏色變體
          variantStyles[variant],
          // 尺寸
          sizeStyles[size].container,
          className
        )}
        {...props}
      >
        {Icon ? (
          <Icon className={cn('text-white', sizeStyles[size].icon)} />
        ) : (
          <div className={cn('text-white', sizeStyles[size].icon)}>
            {children}
          </div>
        )}
      </div>
    )
  }
)

IconContainer.displayName = 'IconContainer'

/**
 * 使用範例：
 * 
 * <IconContainer icon={Brain} variant="primary" size="md" />
 * <IconContainer icon={CheckCircle} variant="success" size="lg" />
 * <IconContainer icon={AlertTriangle} variant="warning" size="sm" />
 */

