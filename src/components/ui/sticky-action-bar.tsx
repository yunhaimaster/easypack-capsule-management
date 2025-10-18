'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StickyActionBarProps {
  onSave: () => void | Promise<void>
  onCancel: () => void
  isDirty: boolean
  isSaving?: boolean
  saveLabel?: string
  cancelLabel?: string
  className?: string
  showKeyboardHint?: boolean
}

export function StickyActionBar({
  onSave,
  onCancel,
  isDirty,
  isSaving = false,
  saveLabel = '儲存',
  cancelLabel = '取消',
  className,
  showKeyboardHint = true
}: StickyActionBarProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Detect macOS for keyboard shortcut display
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  const handleSave = async () => {
    await onSave()
  }

  return (
    <div
      className={cn(
        // Sticky positioning at bottom
        'fixed bottom-0 left-0 right-0',
        // Higher z-index to ensure visibility
        'z-[100]',
        // Liquid glass effect
        'liquid-glass-card border-t',
        'backdrop-blur-xl',
        // Safe area padding for mobile
        'pb-safe',
        // Smooth slide-up animation
        'transition-transform duration-300 ease-out',
        isMounted ? 'translate-y-0' : 'translate-y-full',
        // Reduced motion support
        'motion-reduce:transition-none',
        className
      )}
      role="toolbar"
      aria-label="操作列"
      style={{
        // Force visibility with explicit styles
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Glass content wrapper */}
      <div className="liquid-glass-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Action bar content */}
          <div className="flex items-center justify-between gap-4 h-[72px]">
            {/* Left side: Dirty indicator and keyboard hint */}
            <div className="flex items-center gap-3">
              {/* Dirty state indicator */}
              {isDirty && (
                <div 
                  className={cn(
                    "flex items-center gap-2 text-sm text-warning-600",
                    "animate-pulse-subtle"
                  )}
                  role="status"
                  aria-live="polite"
                >
                  <span className="w-2 h-2 rounded-full bg-warning-500" />
                  <span className="hidden sm:inline">未儲存的變更</span>
                </div>
              )}

              {/* Keyboard shortcut hint */}
              {showKeyboardHint && isDirty && (
                <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-500">
                  <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-neutral-700 font-mono">
                    {isMac ? '⌘' : 'Ctrl'}
                  </kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded text-neutral-700 font-mono">
                    S
                  </kbd>
                  <span className="ml-1">儲存</span>
                </div>
              )}
            </div>

            {/* Right side: Action buttons */}
            <div className="flex items-center gap-3">
              {/* Cancel button */}
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
                className={cn(
                  "min-w-[88px] min-h-[44px]",
                  "touch-feedback",
                  "transition-apple"
                )}
              >
                <X className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {cancelLabel}
              </Button>

              {/* Save button */}
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "min-w-[120px] min-h-[44px]",
                  "touch-feedback",
                  "transition-apple",
                  // Dynamic styling based on dirty state
                  isDirty
                    ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                    : "bg-neutral-200 hover:bg-neutral-300 text-neutral-600"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" aria-hidden="true" />
                    {saveLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isSaving && '正在儲存...'}
        {isDirty && !isSaving && '表單已修改，未儲存'}
        {!isDirty && !isSaving && '所有變更已儲存'}
      </div>
    </div>
  )
}

