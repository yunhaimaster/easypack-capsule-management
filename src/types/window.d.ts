/**
 * Global Window Type Declarations
 * 
 * Extends the Window interface with additional properties used in the application.
 * This provides TypeScript type safety for global window objects.
 */

declare global {
  interface Window {
    /**
     * Google Analytics (gtag.js) function
     * Used for event tracking and analytics
     * 
     * @example
     * window.gtag('event', 'update_dismissed', { version: 'v2.8.0' })
     */
    gtag?: (
      command: 'event' | 'config' | 'set',
      action: string,
      params?: Record<string, unknown>
    ) => void
  }
}

// This export is required to make this a module
// Without it, TypeScript treats this as a script and ignores declarations
export {}

