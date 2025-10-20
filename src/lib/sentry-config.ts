/**
 * Sentry Error Tracking Configuration (Optional)
 * 
 * To enable Sentry:
 * 1. npm install --save @sentry/nextjs
 * 2. Create sentry.client.config.ts and sentry.server.config.ts
 * 3. Add SENTRY_DSN to environment variables
 * 4. Uncomment the configuration below
 */

// import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  // Uncomment to enable Sentry
  /*
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Session Replay (optional)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Environment
      environment: process.env.NODE_ENV,
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension',
        'moz-extension',
        
        // Network errors
        'Network request failed',
        'NetworkError',
        
        // AbortController
        'AbortError',
        'The operation was aborted',
      ],
      
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Don't send errors in development
        if (process.env.NODE_ENV === 'development') {
          return null
        }
        
        // Remove sensitive data
        if (event.request) {
          delete event.request.cookies
          delete event.request.headers
        }
        
        return event
      },
    })
  }
  */
}

// Helper function to capture errors manually
export function captureError(
  error: Error,
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Error]', error, context)
    
    // Uncomment to send to Sentry
    /*
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error, {
        extra: context,
      })
    }
    */
  } else {
    // In development, just log
    console.error('[Dev Error]', error, context)
  }
}

// Helper function to set user context
export function setUserContext(userId: string, userInfo?: Record<string, any>) {
  // Uncomment to enable Sentry
  /*
  if (typeof Sentry !== 'undefined') {
    Sentry.setUser({
      id: userId,
      ...userInfo,
    })
  }
  */
}

// Helper function to add breadcrumbs
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  // Uncomment to enable Sentry
  /*
  if (typeof Sentry !== 'undefined') {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    })
  }
  */
  
  // In development, log breadcrumbs
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Breadcrumb] ${category}:`, message, data)
  }
}

/**
 * Installation Instructions:
 * 
 * 1. Install Sentry:
 *    npm install --save @sentry/nextjs
 * 
 * 2. Run Sentry wizard:
 *    npx @sentry/wizard@latest -i nextjs
 * 
 * 3. Add to .env.local:
 *    NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
 *    SENTRY_AUTH_TOKEN=your_auth_token_here
 * 
 * 4. Uncomment code in this file
 * 
 * 5. Import and initialize in app/layout.tsx:
 *    import { initSentry } from '@/lib/sentry-config'
 *    initSentry()
 */

