/**
 * Client-side data fetching utilities
 * Optimized for browser environments with retry logic and error handling
 */

/**
 * Fetch with automatic retry logic
 * Useful for handling temporary network issues
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit & {
    retries?: number
    retryDelay?: number
    timeout?: number
  } = {}
): Promise<T> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error as Error

      // Don't retry on certain errors
      if (
        error instanceof Error &&
        (error.message.includes('404') || error.message.includes('401'))
      ) {
        throw error
      }

      // If this was our last attempt, throw the error
      if (attempt === retries) {
        break
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * Math.pow(2, attempt))
      )
    }
  }

  throw lastError || new Error('Fetch failed after retries')
}

/**
 * Fetch multiple resources in parallel
 */
export async function fetchParallel<T = any>(
  urls: string[],
  options?: RequestInit
): Promise<T[]> {
  const results = await Promise.allSettled(
    urls.map((url) => fetchWithRetry<T>(url, options))
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    console.error(`Failed to fetch ${urls[index]}:`, result.reason)
    return null as T
  })
}

/**
 * Debounced fetch for search/filter operations
 */
export function createDebouncedFetch<T = any>(
  delayMs: number = 300
): (url: string, options?: RequestInit) => Promise<T | null> {
  let timeoutId: NodeJS.Timeout | null = null
  let lastController: AbortController | null = null

  return async (url: string, options?: RequestInit): Promise<T | null> => {
    // Cancel previous request
    if (lastController) {
      lastController.abort()
    }

    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Create new abort controller
    const controller = new AbortController()
    lastController = controller

    // Return promise that resolves after debounce delay
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.json()
          resolve(data)
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Request was cancelled, resolve with null
            resolve(null)
          } else {
            console.error('Fetch error:', error)
            resolve(null)
          }
        }
      }, delayMs)
    })
  }
}

/**
 * Simple client-side cache for frequently accessed data
 */
class ClientCache<T = any> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number

  constructor(ttlSeconds: number = 60) {
    this.ttl = ttlSeconds * 1000
  }

  get(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

// Export a singleton cache instance
export const clientCache = new ClientCache(60) // 60 seconds TTL

/**
 * Fetch with caching
 */
export async function fetchWithCache<T = any>(
  url: string,
  options?: RequestInit & { cacheTtl?: number }
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options)}`
  
  // Check cache
  const cached = clientCache.get(cacheKey)
  if (cached) {
    return cached as T
  }

  // Fetch and cache
  const data = await fetchWithRetry<T>(url, options)
  clientCache.set(cacheKey, data)
  
  return data
}

/**
 * Optimistic update pattern
 * Updates local state immediately, then syncs with server
 */
export async function optimisticUpdate<T = any>(
  updateFn: () => void,
  serverUpdateFn: () => Promise<T>,
  rollbackFn: () => void
): Promise<T> {
  try {
    // Apply optimistic update immediately
    updateFn()
    
    // Sync with server
    const result = await serverUpdateFn()
    
    return result
  } catch (error) {
    // Rollback on error
    rollbackFn()
    throw error
  }
}

