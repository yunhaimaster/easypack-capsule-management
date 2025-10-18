'use client'

import { ReactNode, useEffect } from 'react'
import { ToastProvider } from '@/components/ui/toast-provider'
import { OfflineIndicator } from '@/hooks/use-offline'
import { registerServiceWorker, setupPWAInstallPrompt } from '@/lib/pwa-utils'

export function AppClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Register service worker for PWA
    registerServiceWorker()
    
    // Setup PWA install prompt
    setupPWAInstallPrompt()
  }, [])

  return (
    <ToastProvider>
      {children}
      <OfflineIndicator />
    </ToastProvider>
  )
}
