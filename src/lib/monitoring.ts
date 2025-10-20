/**
 * Monitoring and Analytics Configuration
 * Centralized configuration for Vercel Analytics and performance monitoring
 */

// Track custom events
export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
) {
  // Vercel Analytics automatically tracks page views
  // Use this for custom events if needed
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.log('[Analytics]', eventName, properties)
    // Vercel Analytics will automatically capture these
  }
}

// Track errors
export function trackError(
  error: Error,
  context?: Record<string, any>
) {
  if (typeof window !== 'undefined') {
    console.error('[Error Tracking]', error.message, {
      stack: error.stack,
      ...context
    })
    
    // In production, errors are automatically captured by Vercel
    if (process.env.NODE_ENV === 'production') {
      // Additional error tracking logic can be added here
      // For example, sending to external service
    }
  }
}

// Track performance metrics
export function trackPerformance(
  metricName: string,
  value: number,
  unit: string = 'ms'
) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.log('[Performance]', metricName, `${value}${unit}`)
    
    // Use Performance API if available
    if ('performance' in window && 'measure' in window.performance) {
      try {
        window.performance.mark(metricName)
      } catch (e) {
        // Ignore errors from performance API
      }
    }
  }
}

// Track user actions
export const MonitoringEvents = {
  // Order events
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_DELETED: 'order_deleted',
  ORDER_EXPORTED: 'order_exported',
  
  // Recipe events
  RECIPE_CREATED: 'recipe_created',
  RECIPE_IMPORTED: 'recipe_imported',
  RECIPE_ANALYZED: 'recipe_analyzed',
  RECIPE_EXPORTED: 'recipe_exported',
  
  // AI events
  AI_CHAT_STARTED: 'ai_chat_started',
  AI_ANALYSIS_COMPLETED: 'ai_analysis_completed',
  AI_RECIPE_GENERATED: 'ai_recipe_generated',
  
  // Search events
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  
  // Auth events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
} as const

// Performance thresholds (in milliseconds)
export const PerformanceThresholds = {
  PAGE_LOAD: 3000,       // Page should load within 3s
  API_RESPONSE: 1000,    // API should respond within 1s
  AI_RESPONSE: 10000,    // AI can take up to 10s
  SEARCH_DEBOUNCE: 500,  // Search should debounce at 500ms
} as const

// Monitor API call performance
export async function monitorApiCall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    const duration = performance.now() - startTime
    
    trackPerformance(`api_${apiName}`, duration)
    
    if (duration > PerformanceThresholds.API_RESPONSE) {
      console.warn(`[Performance Warning] ${apiName} took ${duration}ms`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    trackError(error as Error, {
      apiName,
      duration,
      type: 'api_error'
    })
    throw error
  }
}

// Web Vitals monitoring (automatically tracked by Vercel Analytics)
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    console.log('[Web Vitals]', metric.name, metric.value)
    
    // Vercel Analytics automatically captures these:
    // - CLS (Cumulative Layout Shift)
    // - FID (First Input Delay)
    // - FCP (First Contentful Paint)
    // - LCP (Largest Contentful Paint)
    // - TTFB (Time to First Byte)
  }
}

