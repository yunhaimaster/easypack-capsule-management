'use client'

import { useEffect, useRef, ReactNode, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LiquidGlassModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  headerButtons?: ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  className?: string
  animateFrom?: 'button' | 'center'
  fullscreen?: boolean
  zIndex?: number
}

export function LiquidGlassModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerButtons,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  animateFrom = 'center',
  fullscreen = false,
  zIndex
}: LiquidGlassModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPortalContainer(document.body)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ]
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(focusableSelectors.join(',')) || []
      if (focusable.length) {
        focusable[0].focus()
      } else {
        modalRef.current?.focus()
      }
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return

        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      const body = document.body
      body.dataset.scrollY = window.scrollY.toString()
      body.style.overflow = 'hidden'
      body.style.position = 'fixed'
      body.style.top = `-${window.scrollY}px`
      body.style.width = '100%'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const body = document.body
      const scrollY = parseInt(body.dataset.scrollY || '0', 10)
      body.style.overflow = 'unset'
      body.style.position = 'unset'
      body.style.top = 'unset'
      body.style.width = 'unset'
      window.scrollTo(0, scrollY)
      delete body.dataset.scrollY
    }
  }, [isOpen, closeOnEscape, onClose])

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleModalClick = (event: React.MouseEvent) => {
    event.stopPropagation()
  }

  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  if (!isOpen || !portalContainer) return null

  const modalNode = (
    <div
      className={`liquid-glass-modal-backdrop active ${className}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      style={zIndex ? { zIndex } : undefined}
    >
      <div
        ref={modalRef}
        className={`liquid-glass-modal ${sizeClasses[size]} ${animateFrom === 'button' ? 'liquid-glass-modal-scale-from-button' : 'liquid-glass-modal-scale-from-center'} ${fullscreen ? 'fullscreen' : ''} ${className}`}
        onClick={handleModalClick}
        role="document"
        tabIndex={-1}
      >
        {(title || closeOnEscape || headerButtons) && (
          <div className="liquid-glass-modal-header">
            {title && (
              <h2 id="modal-title" className="liquid-glass-modal-title">
                {title}
              </h2>
            )}
            <div className="flex items-center space-x-2">
              {headerButtons}
              <button
                className="liquid-glass-modal-close"
                onClick={onClose}
                aria-label="關閉對話框"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="liquid-glass-modal-content">
          {children}
        </div>

        {footer && (
          <div className="liquid-glass-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalNode, portalContainer)
}

// Hook for managing modal state
export function useLiquidGlassModal() {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  const toggleModal = () => setIsOpen(!isOpen)

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  }
}

// Preset modal components for common use cases
export function LiquidGlassConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "確認操作",
  message,
  confirmText = "確認",
  cancelText = "取消",
  variant = "default"
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "danger"
}) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xs"
      className={`confirm-modal ${variant === 'danger' ? 'confirm-danger' : ''}`}
    >
      <div className="confirm-modal-body">
        <div className="confirm-modal-icon">
          <X className="h-5 w-5" />
        </div>
        <div className="confirm-modal-text">
          <div className="confirm-modal-title">{title}</div>
          <p className="confirm-modal-message">{message}</p>
        </div>
      </div>
      <div className="confirm-modal-actions">
        <Button
          variant="outline"
          onClick={onClose}
          className="confirm-cancel"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          className={`confirm-primary ${variant === 'danger' ? 'confirm-danger' : ''}`}
        >
          {confirmText}
        </Button>
      </div>
    </LiquidGlassModal>
  )
}

export function LiquidGlassInfoModal({
  isOpen,
  onClose,
  title = "資訊",
  message,
  buttonText = "了解"
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  buttonText?: string
}) {
  return (
    <LiquidGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      className="white-theme"
    >
      <p className="mb-6 text-neutral-900 dark:text-white/95">{message}</p>
      <div className="liquid-glass-modal-footer">
        <Button
          onClick={onClose}
          className="liquid-glass-modal-button"
        >
          {buttonText}
        </Button>
      </div>
    </LiquidGlassModal>
  )
}
