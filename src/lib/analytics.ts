/**
 * Production Analytics and Performance Monitoring
 * Tracks Core Web Vitals and custom metrics for production monitoring
 */

interface AnalyticsEvent {
  name: string
  value?: number
  properties?: Record<string, any>
  timestamp: number
}

interface CoreWebVitals {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

class Analytics {
  private events: AnalyticsEvent[] = []
  private isEnabled = false

  constructor() {
    // Only enable analytics in production
    this.isEnabled = process.env.NODE_ENV === 'production'
  }

  /**
   * Track a custom event
   */
  track(name: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now()
    }

    this.events.push(event)
    this.sendEvent(event)
  }

  /**
   * Track Core Web Vitals
   */
  trackWebVitals(metrics: CoreWebVitals) {
    if (!this.isEnabled) return

    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        this.track(`web_vital_${key}`, {
          value,
          metric: key,
          url: window.location.pathname
        })
      }
    })
  }

  /**
   * Track page performance
   */
  trackPagePerformance() {
    if (!this.isEnabled) return

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      this.track('page_load_time', {
        value: navigation.loadEventEnd - navigation.fetchStart,
        url: window.location.pathname
      })

      this.track('dns_lookup_time', {
        value: navigation.domainLookupEnd - navigation.domainLookupStart,
        url: window.location.pathname
      })

      this.track('tcp_connection_time', {
        value: navigation.connectEnd - navigation.connectStart,
        url: window.location.pathname
      })
    }

    // Resource timing
    const resources = performance.getEntriesByType('resource')
    const totalResourceSize = resources.reduce((total, resource) => {
      const resourceEntry = resource as any
      return total + (resourceEntry.transferSize || 0)
    }, 0)

    this.track('total_resource_size', {
      value: totalResourceSize,
      url: window.location.pathname
    })
  }

  /**
   * Track user interactions
   */
  trackInteraction(action: string, element?: string, value?: number) {
    this.track('user_interaction', {
      action,
      element,
      value,
      url: window.location.pathname
    })
  }

  /**
   * Track API performance
   */
  trackAPIPerformance(endpoint: string, duration: number, status: number) {
    this.track('api_performance', {
      endpoint,
      duration,
      status,
      url: window.location.pathname
    })
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: string) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.pathname
    })
  }

  /**
   * Send event to analytics service
   * In production, this would send to your analytics provider
   */
  private sendEvent(event: AnalyticsEvent) {
    // For now, just log to console in development
    // In production, you would send to your analytics service
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Analytics Event:', event)
    }

    // Example: Send to analytics service
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // }).catch(err => {
    //   // eslint-disable-next-line no-console
    //   console.error('Analytics error:', err)
    // })
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  /**
   * Clear all events
   */
  clearEvents() {
    this.events = []
  }
}

// Create singleton instance
export const analytics = new Analytics()

// Initialize Core Web Vitals tracking
if (typeof window !== 'undefined') {
  // Track page performance on load
  window.addEventListener('load', () => {
    analytics.trackPagePerformance()
  })

  // Track Core Web Vitals
  if ('PerformanceObserver' in window) {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          analytics.trackWebVitals({ fcp: entry.startTime })
        }
      }
    }).observe({ entryTypes: ['paint'] })

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      analytics.trackWebVitals({ lcp: lastEntry.startTime })
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        analytics.trackWebVitals({ 
          fid: (entry as any).processingStart - entry.startTime 
        })
      }
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      analytics.trackWebVitals({ cls: clsValue })
    }).observe({ entryTypes: ['layout-shift'] })
  }

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    analytics.trackError(event.error, 'unhandled_error')
  })

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    analytics.trackError(new Error(event.reason), 'unhandled_promise_rejection')
  })
}

export default analytics
