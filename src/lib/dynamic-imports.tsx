import dynamic from 'next/dynamic'
import { ComponentType, ReactElement } from 'react'

// Dynamic import utility for better code splitting
export function createDynamicImport(
  importFn: () => Promise<any>,
  options?: {
    loading?: () => ReactElement
    ssr?: boolean
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || (() => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )),
    ssr: options?.ssr !== false,
  })
}

// Pre-configured dynamic imports for common components
export const DynamicComponents = {
  // Marketing components - heavy and not critical for initial load
  MarketingAssistant: createDynamicImport(
    () => import('@/components/marketing/marketing-analysis').then(mod => ({ default: mod.MarketingAnalysis })),
    { ssr: false }
  ),
  ImageGenerator: createDynamicImport(
    () => import('@/components/marketing/image-generator').then(mod => ({ default: mod.ImageGenerator })),
    { ssr: false }
  ),
  BlueprintGenerator: createDynamicImport(
    () => import('@/components/marketing/blueprint-generator').then(mod => ({ default: mod.BlueprintGenerator })),
    { ssr: false }
  ),
  
  // Recipe library components - large datasets
  RecipeLibrary: createDynamicImport(
    () => import('@/components/recipe-library/recipe-list-item').then(mod => ({ default: mod.RecipeListItem })),
    { ssr: false }
  ),
  BatchAnalysisModal: createDynamicImport(
    () => import('@/components/recipe-library/batch-analysis-modal').then(mod => ({ default: mod.BatchAnalysisModal })),
    { ssr: false }
  ),
  
  // AI components - heavy processing
  SmartAIAssistant: createDynamicImport(
    () => import('@/components/ai/smart-ai-assistant').then(mod => ({ default: mod.SmartAIAssistant })),
    { ssr: false }
  ),
  AIAssistant: createDynamicImport(
    () => import('@/components/ai/ai-assistant').then(mod => ({ default: mod.AIAssistant })),
    { ssr: false }
  ),
}

// Lazy loading utility for images
export function createLazyImage(src: string, alt: string, className?: string) {
  return dynamic(
    () => import('next/image').then(mod => ({ default: mod.default })),
    {
      loading: () => (
        <div className={`bg-neutral-200 animate-pulse ${className}`}>
          <div className="flex items-center justify-center h-full">
            <span className="text-neutral-400">載入中...</span>
          </div>
        </div>
      ),
      ssr: false,
    }
  )
}

// Conditional dynamic imports based on feature flags
export function createConditionalImport(
  condition: boolean,
  importFn: () => Promise<any>,
  fallback?: any
) {
  if (!condition && fallback) {
    return fallback
  }
  
  return createDynamicImport(importFn)
}

// Route-based dynamic imports
export const RouteComponents = {
  // Note: These pages will be added as needed for lazy loading
  // OrdersPage: createDynamicImport(
  //   () => import('@/app/orders/page').then(mod => ({ default: mod.default })),
  //   { ssr: false }
  // ),
}

// Utility for chunk analysis
export function analyzeChunks() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.group('📊 Bundle Analysis')
    // eslint-disable-next-line no-console
    console.log('Loaded chunks:', Object.keys((window as any).__webpack_require__.cache || {}))
    // eslint-disable-next-line no-console
    console.log('Performance timing:', performance.getEntriesByType('navigation')[0])
    // eslint-disable-next-line no-console
    console.groupEnd()
  }
}

// Preload critical components
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload critical UI components
    import('@/components/ui/button')
    import('@/components/ui/card')
    import('@/components/ui/input')
    
    // Preload icons
    import('lucide-react')
  }
}

// Dynamic import with retry logic
export function createRetryableImport(
  importFn: () => Promise<any>,
  maxRetries: number = 3
) {
  return dynamic(
    async () => {
      let lastError: Error | null = null
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await importFn()
        } catch (error) {
          lastError = error as Error
          if (i < maxRetries - 1) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
          }
        }
      }
      
      throw lastError || new Error('Failed to load component after retries')
    },
    {
      loading: () => (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-neutral-600">載入組件中...</p>
          </div>
        </div>
      ),
      ssr: false,
    }
  )
}
