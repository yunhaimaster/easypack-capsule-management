"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cn } from '@/lib/utils'

interface ToastMessage {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    setToasts((previous) => {
      const baseDuration = toast.variant === 'destructive' ? Infinity : 10000
      const newToast: ToastMessage = {
        id: crypto.randomUUID(),
        duration: baseDuration,
        variant: 'default',
        ...toast
      }
      return [...previous, newToast]
    })
  }, [])

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    if (!open) {
      setToasts((previous) => previous.filter((toast) => toast.id !== id))
    }
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        <div className="fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-80">
          {toasts.map(({ id, title, description, duration, variant }) => (
            <ToastPrimitive.Root
              key={id}
              duration={Number.isFinite(duration) ? duration : undefined}
              className={cn(
                'liquid-glass-toast px-4 py-3 text-sm text-neutral-800 dark:text-neutral-100 flex flex-col gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                variant === 'destructive' && 'border-danger-300 bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300'
              )}
              onOpenChange={(open) => handleOpenChange(id, open)}
              role={variant === 'destructive' ? 'alert' : 'status'}
              aria-live={variant === 'destructive' ? 'assertive' : 'polite'}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {title && <ToastPrimitive.Title className="font-medium text-base text-neutral-900 dark:text-neutral-100">{title}</ToastPrimitive.Title>}
                  {description && (
                    <ToastPrimitive.Description className="text-sm text-neutral-600 dark:text-neutral-300">
                      {description}
                    </ToastPrimitive.Description>
                  )}
                </div>
                <ToastPrimitive.Close
                  className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full"
                  aria-label="關閉通知"
                >
                  ×
                </ToastPrimitive.Close>
              </div>
            </ToastPrimitive.Root>
          ))}
        </div>
        <ToastPrimitive.Viewport className="pointer-events-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}
