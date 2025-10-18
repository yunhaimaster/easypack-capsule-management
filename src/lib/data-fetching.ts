/**
 * Data Fetching Utilities for Next.js App Router
 * Implements caching, revalidation, and error handling best practices
 */

import { cache } from 'react'
import 'server-only'

/**
 * Cache configuration presets
 */
export const CacheConfig = {
  /** No caching - always fetch fresh data */
  NoStore: { cache: 'no-store' as const },
  
  /** Cache indefinitely until manually revalidated */
  ForceCache: { cache: 'force-cache' as const },
  
  /** Revalidate every 60 seconds */
  Revalidate60: { next: { revalidate: 60 } },
  
  /** Revalidate every 5 minutes */
  Revalidate5Min: { next: { revalidate: 300 } },
  
  /** Revalidate every hour */
  RevalidateHourly: { next: { revalidate: 3600 } },
  
  /** Revalidate daily */
  RevalidateDaily: { next: { revalidate: 86400 } },
} as const

/**
 * Create a cached data fetcher
 * Uses React.cache for request memoization
 */
export function createCachedFetcher<T, Args extends any[]>(
  fetcher: (...args: Args) => Promise<T>,
  options?: {
    revalidate?: number
    tags?: string[]
  }
) {
  return cache(async (...args: Args): Promise<T> => {
    return fetcher(...args)
  })
}

/**
 * Fetch with automatic retry and error handling
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit & { retries?: number; retryDelay?: number } = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options
  
  let lastError: Error | null = null
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, fetchOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry on last attempt
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
      }
    }
  }
  
  throw lastError || new Error('Fetch failed after retries')
}

/**
 * Parallel data fetching with error handling
 */
export async function fetchParallel<T extends Record<string, Promise<any>>>(
  fetchers: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const entries = Object.entries(fetchers)
  const results = await Promise.allSettled(entries.map(([_, promise]) => promise))
  
  const data: any = {}
  const errors: any = {}
  
  results.forEach((result, index) => {
    const [key] = entries[index]
    
    if (result.status === 'fulfilled') {
      data[key] = result.value
    } else {
      errors[key] = result.reason
      data[key] = null
    }
  })
  
  // Log errors but don't throw - allow partial data
  if (Object.keys(errors).length > 0) {
    console.error('Parallel fetch errors:', errors)
  }
  
  return data
}

/**
 * Prefetch data for performance optimization
 */
export function preload<T>(fetcher: () => Promise<T>): void {
  void fetcher()
}

/**
 * Create a type-safe API client with caching
 */
export function createAPIClient<T extends Record<string, any>>(baseUrl: string) {
  const get = cache(async <K extends keyof T>(
    endpoint: K,
    options?: RequestInit
  ): Promise<T[K]> => {
    const url = `${baseUrl}${String(endpoint)}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return response.json()
  })
  
  const post = async <K extends keyof T>(
    endpoint: K,
    data: any,
    options?: RequestInit
  ): Promise<T[K]> => {
    const url = `${baseUrl}${String(endpoint)}`
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return response.json()
  }
  
  return { get, post }
}

/**
 * Streaming data fetcher for large datasets
 */
export async function* streamData<T>(
  fetcher: (offset: number, limit: number) => Promise<T[]>,
  batchSize = 100
): AsyncGenerator<T[], void, unknown> {
  let offset = 0
  let hasMore = true
  
  while (hasMore) {
    const batch = await fetcher(offset, batchSize)
    
    if (batch.length === 0) {
      hasMore = false
    } else {
      yield batch
      offset += batch.length
      
      if (batch.length < batchSize) {
        hasMore = false
      }
    }
  }
}

/**
 * Deduplicate concurrent requests
 */
const pendingRequests = new Map<string, Promise<any>>()

export async function deduplicateFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }
  
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, promise)
  return promise
}

/**
 * Create a batched data loader (useful for N+1 queries)
 */
export function createBatchLoader<K, V>(
  batchFn: (keys: K[]) => Promise<V[]>,
  options?: {
    maxBatchSize?: number
    batchDelayMs?: number
  }
) {
  const { maxBatchSize = 100, batchDelayMs = 10 } = options || {}
  
  let batch: Array<{
    key: K
    resolve: (value: V) => void
    reject: (error: any) => void
  }> = []
  let batchTimeout: NodeJS.Timeout | null = null
  
  const processBatch = async () => {
    const currentBatch = batch
    batch = []
    batchTimeout = null
    
    try {
      const keys = currentBatch.map(item => item.key)
      const results = await batchFn(keys)
      
      currentBatch.forEach((item, index) => {
        item.resolve(results[index])
      })
    } catch (error) {
      currentBatch.forEach(item => {
        item.reject(error)
      })
    }
  }
  
  return (key: K): Promise<V> => {
    return new Promise((resolve, reject) => {
      batch.push({ key, resolve, reject })
      
      if (batch.length >= maxBatchSize) {
        if (batchTimeout) clearTimeout(batchTimeout)
        void processBatch()
      } else if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
          void processBatch()
        }, batchDelayMs)
      }
    })
  }
}

