/**
 * Quick View Drawer Component
 * 
 * A slide-in panel from the right side for displaying detailed information
 * without leaving the current page.
 * 
 * Features:
 * - Slides in from right with 300ms Apple HIG animation
 * - Backdrop blur + semi-transparent overlay
 * - Supports keyboard (Escape to close)
 * - Click outside to close
 * - Mobile responsive (90vw max width)
 */

'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface QuickViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export function QuickViewDrawer({
  isOpen,
  onClose,
  children,
  title,
  className
}: QuickViewDrawerProps) {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // Use Portal to render outside parent DOM hierarchy
  // This ensures fixed positioning works correctly regardless of parent transforms/filters
  const drawerContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-opacity duration-300 ease-in-out"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-[10000] w-[500px] max-w-[90vw]",
          "bg-surface-primary dark:bg-surface-primary",
          "shadow-[-8px_0_32px_rgba(0,0,0,0.12)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.4)]",
          "transition-transform duration-300 ease-in-out",
          "liquid-glass-card",
          "overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Quick View"}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          zIndex: 10000,
          maxHeight: '100vh',
          overflow: 'hidden'
        }}
      >
        <div className="flex flex-col h-full liquid-glass-content overflow-hidden">
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                aria-label="關閉"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {children}
          </div>
        </div>
      </div>
    </>
  )

  // Render to document.body using Portal to avoid parent container CSS conflicts
  // Fixed positioning can be affected by parent transforms/filters
  if (typeof window === 'undefined') return null
  return createPortal(drawerContent, document.body)
}

