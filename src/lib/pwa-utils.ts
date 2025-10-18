/**
 * PWA Utilities
 * Handles service worker registration and PWA installation
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) {
    // Service Workers not supported
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Service Worker registered successfully

        // Check for updates every hour
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - auto reload after 3 seconds
              setTimeout(() => {
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                window.location.reload()
              }, 3000)
            }
          })
        })
      })
      .catch(() => {
        // Service Worker registration failed silently
      })

    // Listen for service worker controlling the page
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  })
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function setupPWAInstallPrompt() {
  if (typeof window === 'undefined') return

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent
    
    // Optionally show your own install button
    // You can dispatch a custom event here to show UI
    window.dispatchEvent(new Event('pwa-installable'))
  })

  window.addEventListener('appinstalled', () => {
    // App installed successfully
    deferredPrompt = null
    // Track installation analytics if needed
  })
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false
  }

  try {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    return outcome === 'accepted'
  } catch {
    return false
  } finally {
    deferredPrompt = null
  }
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (window.navigator as any).standalone === true
  
  return isStandalone || isIOSStandalone
}

export function getPWADisplayMode(): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' {
  if (typeof window === 'undefined') return 'browser'
  
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  if (isStandalone) return 'standalone'
  
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches
  if (isMinimalUI) return 'minimal-ui'
  
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches
  if (isFullscreen) return 'fullscreen'
  
  return 'browser'
}

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

export function setupOnlineListener(
  onOnline?: () => void,
  onOffline?: () => void
) {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    onOnline?.()
  })

  window.addEventListener('offline', () => {
    onOffline?.()
  })
}

