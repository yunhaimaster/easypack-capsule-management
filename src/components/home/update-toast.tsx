/**
 * Update Toast Notifier - Toast Notification Logic
 * 
 * Logic-only component that shows a toast notification once per new version.
 * Runs automatically on page load if user hasn't seen the toast yet.
 * 
 * Features:
 * - Shows once per version
 * - 1.5s delay for smooth UX (don't overwhelm immediately)
 * - 8s duration for reading
 * - Analytics tracking
 * - Non-blocking (doesn't prevent page interaction)
 */

'use client'

import { useEffect } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import { useUpdateNotification } from '@/hooks/use-update-notification'
import { CURRENT_VERSION } from '@/data/version-history'

/**
 * UpdateToastNotifier Component
 * 
 * This is a "logic-only" component - it doesn't render anything visible.
 * It manages the toast notification lifecycle:
 * 1. Checks if toast should be shown
 * 2. Waits appropriate delay
 * 3. Triggers toast
 * 4. Marks as seen
 * 5. Tracks analytics
 * 
 * Usage: Add once near root of app (e.g., in homepage)
 * 
 * @example
 * <UpdateToastNotifier />
 */
export function UpdateToastNotifier() {
  const { hasSeenToast, markToastSeen, isNewVersion, isDismissed } = useUpdateNotification()
  const { showToast } = useToast()
  
  useEffect(() => {
    // Don't show toast if:
    // - Already seen this version
    // - Not a new version
    // - Update card already dismissed (they've acknowledged it)
    if (hasSeenToast || !isNewVersion || isDismissed) {
      return
    }
    
    // Delay toast to avoid overwhelming user immediately on page load
    // 1.5s gives time to read page title and see update card first
    const timer = setTimeout(() => {
      try {
        // Show toast notification
        showToast({
          title: `系統已更新至 ${CURRENT_VERSION.version}`,
          description: `${CURRENT_VERSION.type} - 點擊查看完整更新內容`,
          variant: 'default',
          duration: 8000 // 8 seconds for reading
        })
        
        // Mark as seen so it doesn't show again
        markToastSeen()
        
        // Track analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'update_toast_shown', {
            version: CURRENT_VERSION.version,
            version_type: CURRENT_VERSION.type
          })
        }
      } catch (error) {
        // Fail silently if toast fails - don't break page
        console.error('[UpdateToast] Failed to show toast:', error)
      }
    }, 1500)
    
    // Cleanup: Cancel timer if component unmounts before toast shows
    return () => clearTimeout(timer)
  }, [hasSeenToast, isNewVersion, isDismissed, showToast, markToastSeen])
  
  // This component doesn't render anything
  return null
}

