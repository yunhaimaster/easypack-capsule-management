'use client'

import { ReactNode, useEffect } from 'react'
import { ToastProvider } from '@/components/ui/toast-provider'
import { OfflineIndicator } from '@/hooks/use-offline'
import { setupPWAInstallPrompt } from '@/lib/pwa-utils'
import { QueryProvider } from '@/components/providers/query-provider'

export function AppClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // TEMPORARILY DISABLED: Unregister existing service worker to fix auth
    // The SW was breaking fetch() for /api/auth/* routes
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
          console.log('[PWA] Service Worker unregistered temporarily for auth fix')
        })
      })
    }
    
    // Setup PWA install prompt (keeping this for future re-enable)
    setupPWAInstallPrompt()
  }, [])

  return (
    <QueryProvider>
      <ToastProvider>
        {children}
        <OfflineIndicator />
      </ToastProvider>
    </QueryProvider>
  )
}
