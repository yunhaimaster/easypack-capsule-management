'use client'

import { useEffect, useState, useCallback } from 'react'
import { preload } from 'react-dom'
import { logger } from '@/lib/logger'

interface ResourcePreloaderProps {
  resources: Array<{
    href: string
    as?: 'image' | 'script' | 'style' | 'font'
    crossOrigin?: 'anonymous' | 'use-credentials'
    media?: string
  }>
  priority?: boolean
  onLoad?: (resource: string) => void
  onError?: (resource: string, error: Error) => void
}

export function ResourcePreloader({
  resources,
  priority = false,
  onLoad,
  onError
}: ResourcePreloaderProps) {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set())
  const [failedResources, setFailedResources] = useState<Set<string>>(new Set())

  const preloadResource = useCallback(async (resource: typeof resources[0]) => {
    try {
      // Use React 19's preload API
      await preload(resource.href, {
        ...(resource.as && { as: resource.as }),
        ...(resource.crossOrigin && { crossOrigin: resource.crossOrigin }),
        ...(resource.media && { media: resource.media }),
      } as any)

      setLoadedResources(prev => new Set([...prev, resource.href]))
      onLoad?.(resource.href)
      
      logger.info('Resource preloaded successfully', { href: resource.href })
    } catch (error) {
      setFailedResources(prev => new Set([...prev, resource.href]))
      onError?.(resource.href, error as Error)
      
      logger.error('Failed to preload resource', {
        href: resource.href,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, [onLoad, onError])

  useEffect(() => {
    if (resources.length === 0) return

    const preloadAll = async () => {
      const preloadPromises = resources.map(resource => preloadResource(resource))
      
      if (priority) {
        // For priority resources, wait for all to complete
        await Promise.allSettled(preloadPromises)
      } else {
        // For non-priority resources, start them all but don't wait
        preloadPromises.forEach(promise => {
          promise.catch(error => {
            logger.warn('Non-priority resource preload failed', { error })
          })
        })
      }
    }

    preloadAll()
  }, [resources, priority, preloadResource])

  return null // This component doesn't render anything
}

// Hook for preloading resources
export function useResourcePreloader() {
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadedResources, setPreloadedResources] = useState<Set<string>>(new Set())

  const preloadResources = useCallback(async (
    resources: Array<{
      href: string
      as?: 'image' | 'script' | 'style' | 'font'
      crossOrigin?: 'anonymous' | 'use-credentials'
      media?: string
    }>
  ) => {
    setIsPreloading(true)
    
    try {
      const preloadPromises = resources.map(async (resource) => {
        try {
          await preload(resource.href, {
            as: resource.as,
            crossOrigin: resource.crossOrigin,
            media: resource.media,
          } as any)
          
          setPreloadedResources(prev => new Set([...prev, resource.href]))
          return { success: true, href: resource.href }
        } catch (error) {
          logger.error('Failed to preload resource', {
            href: resource.href,
            error: error instanceof Error ? error.message : String(error)
          })
          return { success: false, href: resource.href, error }
        }
      })

      const results = await Promise.allSettled(preloadPromises)
      return results
    } finally {
      setIsPreloading(false)
    }
  }, [])

  return {
    preloadResources,
    isPreloading,
    preloadedResources,
  }
}

// Preload critical API routes
export function useApiPreloader() {
  const [preloadedApis, setPreloadedApis] = useState<Set<string>>(new Set())

  const preloadApi = useCallback(async (apiPath: string) => {
    try {
      // Preload the API route by making a HEAD request
      const response = await fetch(apiPath, { method: 'HEAD' })
      
      if (response.ok) {
        setPreloadedApis(prev => new Set([...prev, apiPath]))
        logger.info('API preloaded successfully', { apiPath })
      }
    } catch (error) {
      logger.error('Failed to preload API', {
        apiPath,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, [])

  const preloadCriticalApis = useCallback(async () => {
    const criticalApis = [
      '/api/orders',
      '/api/recipes',
      '/api/worklogs',
    ]

    await Promise.allSettled(
      criticalApis.map(api => preloadApi(api))
    )
  }, [preloadApi])

  return {
    preloadApi,
    preloadCriticalApis,
    preloadedApis,
  }
}

// Preload images with lazy loading fallback
export function useImagePreloader() {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const preloadImage = useCallback(async (src: string): Promise<boolean> => {
    try {
      const image = new Image()
      
      await new Promise((resolve, reject) => {
        image.onload = () => {
          setPreloadedImages(prev => new Set([...prev, src]))
          resolve(true)
        }
        image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
        image.src = src
      })

      return true
    } catch (error) {
      setFailedImages(prev => new Set([...prev, src]))
      logger.error('Failed to preload image', {
        src,
        error: error instanceof Error ? error.message : String(error)
      })
      return false
    }
  }, [])

  const preloadImages = useCallback(async (srcs: string[]): Promise<boolean[]> => {
    const results = await Promise.allSettled(
      srcs.map(src => preloadImage(src))
    )
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : false
    )
  }, [preloadImage])

  return {
    preloadImage,
    preloadImages,
    preloadedImages,
    failedImages,
  }
}

// Preload fonts
export function useFontPreloader() {
  const [preloadedFonts, setPreloadedFonts] = useState<Set<string>>(new Set())

  const preloadFont = useCallback(async (fontFamily: string, fontWeight?: string | number) => {
    try {
      // Use FontFace API if available
      if ('FontFace' in window) {
        const font = new FontFace(fontFamily, `url(/fonts/${fontFamily}.woff2)`, {
          weight: fontWeight?.toString(),
        })
        
        await font.load()
        document.fonts.add(font)
        
        setPreloadedFonts(prev => new Set([...prev, fontFamily]))
        logger.info('Font preloaded successfully', { fontFamily, fontWeight })
      }
    } catch (error) {
      logger.error('Failed to preload font', {
        fontFamily,
        fontWeight,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, [])

  const preloadSystemFonts = useCallback(async () => {
    const systemFonts = [
      'Inter',
      'SF Pro Display',
      'SF Pro Text',
    ]

    await Promise.allSettled(
      systemFonts.map(font => preloadFont(font))
    )
  }, [preloadFont])

  return {
    preloadFont,
    preloadSystemFonts,
    preloadedFonts,
  }
}
