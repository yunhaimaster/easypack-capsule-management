/**
 * Client-safe error logger
 * This file has no Prisma imports and can be safely used in client components
 */

/**
 * Client-side error logger that sends errors to API endpoint
 * Safe to use in 'use client' components
 */
export function getClientErrorLogger() {
  return async (error: Error, context?: Record<string, any>) => {
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          metadata: context
        })
      })
    } catch (logError) {
      console.error('[ClientErrorLogger] Failed:', logError)
    }
  }
}
