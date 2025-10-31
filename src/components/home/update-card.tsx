/**
 * Update Card Component - Display System Updates
 * 
 * Shows version update information with optional dismissal.
 * Supports two modes:
 * - Top: Compact, dismissible, shows 3 features
 * - Bottom: Full, non-dismissible, shows all features
 * 
 * Features:
 * - Keyboard navigation (Escape to dismiss)
 * - Focus management (moves focus after dismiss)
 * - ARIA live regions for accessibility
 * - Spring physics animations
 * - Dark mode support
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconContainer } from '@/components/ui/icon-container'
import { X, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { CURRENT_VERSION } from '@/data/version-history'
import { useUpdateNotification } from '@/hooks/use-update-notification'
import { useEffect, useRef } from 'react'

interface UpdateCardProps {
  /** Position in layout - affects rendering and behavior */
  position?: 'top' | 'bottom'
  
  /** Compact mode shows fewer features */
  compact?: boolean
  
  /** Allow user to dismiss (top position only) */
  dismissible?: boolean
  
  /** Additional CSS classes */
  className?: string
}

/**
 * UpdateCard Component
 * 
 * Self-contained update notification card with full accessibility support.
 * 
 * @example
 * // Top position (main notification)
 * <UpdateCard position="top" compact={true} dismissible={true} />
 * 
 * // Bottom position (fallback after dismissal)
 * <UpdateCard position="bottom" compact={false} dismissible={false} />
 */
export function UpdateCard({ 
  position = 'top', 
  compact = true, 
  dismissible = true,
  className = ''
}: UpdateCardProps) {
  const { isDismissed, dismissUpdate } = useUpdateNotification()
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Select features based on mode
  const features = compact 
    ? CURRENT_VERSION.features.slice(0, 3) // Top 3 for compact
    : CURRENT_VERSION.features // All features for full view
  
  /**
   * Handle dismiss with focus management
   * Moves focus to next interactive element to maintain keyboard flow
   */
  const handleDismiss = () => {
    dismissUpdate()
    
    // Find and focus next interactive element
    const nextElement = cardRef.current?.nextElementSibling?.querySelector<HTMLElement>(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (nextElement) {
      // Small delay to let card disappear first
      setTimeout(() => nextElement.focus(), 100)
    }
  }
  
  /**
   * Keyboard shortcuts
   * Escape key dismisses the update card (top position only)
   */
  useEffect(() => {
    if (!dismissible || position !== 'top' || isDismissed) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only dismiss if Escape pressed and not in an input
      if (e.key === 'Escape' && !isDismissed) {
        const activeElement = document.activeElement
        const isInInput = activeElement?.tagName === 'INPUT' || 
                         activeElement?.tagName === 'TEXTAREA'
        
        if (!isInInput) {
          e.preventDefault()
          handleDismiss()
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dismissible, position, isDismissed])
  
  // Don't render top card if already dismissed
  // Bottom card always renders as fallback
  // ✅ MOVED AFTER ALL HOOKS - Follows Rules of Hooks
  if (isDismissed && position === 'top') {
    return null
  }
  
  return (
    <Card 
      ref={cardRef}
      className={`liquid-glass-card liquid-glass-card-elevated animate-spring-fade-in ${className}`}
      role={position === 'top' && !isDismissed ? 'alert' : 'region'}
      aria-live={position === 'top' && !isDismissed ? 'polite' : 'off'}
      aria-label="系統更新通知"
    >
      <div className="liquid-glass-content p-6 relative">
        {/* Close button - absolutely positioned top-right */}
        {dismissible && position === 'top' && !isDismissed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors z-10"
            aria-label="關閉更新通知（按 Esc 鍵也可關閉）"
            title="關閉更新通知"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        
        {/* Header with icon, version info, and link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pr-10 sm:pr-0">
          <div className="flex items-center gap-3">
            <IconContainer 
              icon={CalendarDays} 
              variant="primary" 
              size="md"
              className="flex-shrink-0"
            />
            <div>
              <h3 className="text-base font-semibold text-neutral-800 dark:text-white/95">
                {CURRENT_VERSION.date} · {CURRENT_VERSION.type}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-white/75">
                最新版本：{CURRENT_VERSION.version}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Link 
              href="/history" 
              className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-300 hover:underline"
            >
              查看完整歷史
            </Link>
          </div>
        </div>
        
        {/* Feature list */}
        <ul className="space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-white/75">
          {features.map((feature, idx) => {
            // Extract emoji and text
            const emoji = feature.slice(0, 2)
            const text = feature.slice(3)
            
            return (
              <li key={idx} className="flex items-start gap-2">
                <span 
                  className="text-primary-500 dark:text-primary-400 mt-0.5 flex-shrink-0" 
                  aria-hidden="true"
                >
                  {emoji}
                </span>
                <span>{text}</span>
              </li>
            )
          })}
        </ul>
        
        {/* Show "more" link in compact mode */}
        {compact && features.length < CURRENT_VERSION.features.length && (
          <div className="mt-4 text-center">
            <Link 
              href="/history"
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline inline-flex items-center gap-1 transition-colors"
            >
              查看更多更新內容
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

