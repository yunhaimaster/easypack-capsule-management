'use client'

import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { cn } from '@/lib/utils'

interface LiquidGlassLoadingProps {
  title?: string
  message?: string
  showNav?: boolean
  className?: string
}

/**
 * Displays a full-screen Liquid Glass themed loading screen with optional navigation and footer.
 * Useful when awaiting page-level data fetches while preserving overall brand styling.
 */
export function LiquidGlassLoading({
  title = '正在載入',
  message = '請稍候，系統正在準備最新資料…',
  showNav = true,
  className,
}: LiquidGlassLoadingProps) {
  return (
    <div className={cn('min-h-screen brand-logo-bg-animation flex flex-col', className)}>
      {showNav && <LiquidGlassNav />}

      <div className="flex-1 flex items-center justify-center px-6 py-24 sm:py-28">
        <div className="liquid-glass-loader-card">
          <div className="liquid-glass-loader-spot" aria-hidden />
          <div className="space-y-4 text-center">
            <h2 className="text-lg font-semibold text-[--brand-neutral] tracking-wide">
              {title}
            </h2>
            <p className="text-sm text-neutral-600 max-w-sm mx-auto leading-relaxed">
              {message}
            </p>
          </div>
          <div className="liquid-glass-loader-progress">
            <div className="liquid-glass-loader-progress-bar" aria-hidden />
          </div>
          <div className="liquid-glass-loader-pulse" aria-hidden />
        </div>
      </div>

      <LiquidGlassFooter className="w-full" />
    </div>
  )
}
