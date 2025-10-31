'use client'

import { ReactNode, useEffect } from 'react'
import { ToastProvider } from '@/components/ui/toast-provider'
import { OfflineIndicator } from '@/hooks/use-offline'
import { setupPWAInstallPrompt } from '@/lib/pwa-utils'
import { QueryProvider } from '@/components/providers/query-provider'

export function AppClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Enable service worker with improved caching strategy
    // API routes are explicitly bypassed in sw.js, so auth routes work correctly
    import('@/lib/pwa-utils').then(({ registerServiceWorker }) => {
      registerServiceWorker()
    })
    
    // Setup PWA install prompt
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
