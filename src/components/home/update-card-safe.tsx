/**
 * Safe Update Card - Error Boundary Wrapper
 * 
 * Wraps UpdateCard component in an error boundary to prevent crashes
 * from propagating to the entire page.
 * 
 * If UpdateCard throws an error:
 * - Error is logged to console
 * - Component gracefully hides (returns null)
 * - Rest of page continues working normally
 * 
 * This follows the resilience principle: A failing update card should never
 * break the entire application.
 */

'use client'

import { Component, ReactNode } from 'react'
import { UpdateCard } from './update-card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary for Update Card
 * 
 * Class component required for error boundaries (React limitation).
 * Catches errors from UpdateCard and its children.
 */
class UpdateCardErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  /**
   * Called when a descendant component throws an error
   * Updates state to trigger error UI
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true,
      error
    }
  }
  
  /**
   * Called after error is caught
   * Used for error logging/reporting
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging (not to user)
    console.error('[UpdateCard] Component error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
    
    // Send to error tracking service if available
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'exception', {
          description: `UpdateCard error: ${error.message}`,
          fatal: false
        })
      } catch {
        // Fail silently if analytics fails
      }
    }
  }
  
  render() {
    if (this.state.hasError) {
      // Gracefully hide on error - don't show broken UI
      // Update card is nice-to-have, not critical
      return null
    }
    
    return this.props.children
  }
}

/**
 * Safe Update Card Component
 * 
 * Drop-in replacement for UpdateCard with automatic error handling.
 * Same props interface, but wrapped in error boundary.
 * 
 * @example
 * <SafeUpdateCard position="top" compact={true} dismissible={true} />
 */
export function SafeUpdateCard(props: Parameters<typeof UpdateCard>[0]) {
  return (
    <UpdateCardErrorBoundary>
      <UpdateCard {...props} />
    </UpdateCardErrorBoundary>
  )
}

