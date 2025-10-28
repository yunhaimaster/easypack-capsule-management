/**
 * Update Notification Hook - State Management for Update System
 * 
 * This hook provides a complete interface for managing update notifications:
 * - Dismissal state with persistence
 * - Toast notification state
 * - Badge visibility
 * - Multi-tab synchronization via storage events
 * - Performance optimization with useMemo/useCallback
 * - Analytics integration
 * 
 * Black-box design: External components only interact through the returned interface,
 * internal storage and sync mechanisms are hidden.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { CURRENT_VERSION, isNewerVersion } from '@/data/version-history'
import { updateStorage } from '@/lib/update-storage'

export interface UpdateNotificationState {
  /** Whether user has dismissed this version's update card */
  isDismissed: boolean
  
  /** Whether user has seen the toast notification */
  hasSeenToast: boolean
  
  /** Whether to show NEW badge in navigation */
  shouldShowBadge: boolean
  
  /** Whether this is a new version compared to last seen */
  isNewVersion: boolean
  
  /** Dismiss the update card and mark version as seen */
  dismissUpdate: () => void
  
  /** Mark toast notification as seen */
  markToastSeen: () => void
}

/**
 * useUpdateNotification Hook
 * 
 * Manages all update notification state with automatic synchronization across tabs.
 * Optimized for performance with memoization and minimal re-renders.
 * 
 * @example
 * const { isDismissed, dismissUpdate } = useUpdateNotification()
 * if (!isDismissed) {
 *   return <UpdateCard onDismiss={dismissUpdate} />
 * }
 */
export function useUpdateNotification(): UpdateNotificationState {
  // Initialize from storage (SSR-safe)
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return updateStorage.isDismissed(CURRENT_VERSION.version)
  })
  
  const [hasSeenToast, setHasSeenToast] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return updateStorage.hasSeenToast(CURRENT_VERSION.version)
  })
  
  /**
   * Check if current version is newer than last seen version
   * Memoized to prevent unnecessary comparisons
   */
  const isNewVersion = useMemo(() => {
    if (typeof window === 'undefined') return false
    
    const lastSeen = updateStorage.getLastSeenVersion()
    if (!lastSeen) return true // First time user, show update
    
    return isNewerVersion(CURRENT_VERSION.version, lastSeen)
  }, []) // Only compute once on mount
  
  /**
   * Dismiss handler - marks update as dismissed and seen
   * Includes analytics tracking
   */
  const dismissUpdate = useCallback(() => {
    updateStorage.dismiss(CURRENT_VERSION.version)
    updateStorage.setLastSeenVersion(CURRENT_VERSION.version)
    setIsDismissed(true)
    
    // Analytics tracking (non-blocking)
    if (typeof window !== 'undefined' && window.gtag) {
      try {
        window.gtag('event', 'update_dismissed', {
          version: CURRENT_VERSION.version,
          version_type: CURRENT_VERSION.type
        })
      } catch (error) {
        // Fail silently - don't break functionality if analytics fails
        console.error('[UpdateNotification] Analytics error:', error)
      }
    }
  }, []) // No dependencies - version is constant
  
  /**
   * Mark toast as seen
   * Separate from dismiss to allow independent tracking
   */
  const markToastSeen = useCallback(() => {
    updateStorage.markToastSeen(CURRENT_VERSION.version)
    setHasSeenToast(true)
  }, [])
  
  /**
   * Multi-tab synchronization via storage events
   * When user dismisses in one tab, all other tabs update automatically
   */
  useEffect(() => {
    // Only add listener in browser
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e: StorageEvent) => {
      // Check if update dismissal changed
      if (e.key === `update-${CURRENT_VERSION.version}-dismissed`) {
        const newValue = e.newValue === 'true'
        setIsDismissed(newValue)
        
        // If dismissed in another tab, also mark as seen
        if (newValue) {
          updateStorage.setLastSeenVersion(CURRENT_VERSION.version)
        }
      }
      
      // Check if toast state changed
      if (e.key === `toast-${CURRENT_VERSION.version}-shown`) {
        setHasSeenToast(e.newValue === 'true')
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, []) // Only set up once
  
  /**
   * Badge should show if:
   * - Update not dismissed
   * - AND it's a new version
   * - OR it's marked as critical (future enhancement)
   */
  const shouldShowBadge = useMemo(() => {
    return (!isDismissed && isNewVersion) || CURRENT_VERSION.critical === true
  }, [isDismissed, isNewVersion])
  
  return {
    isDismissed,
    hasSeenToast,
    shouldShowBadge,
    isNewVersion,
    dismissUpdate,
    markToastSeen
  }
}

/**
 * Hook variant for admin features (debugging/testing)
 * Provides additional utilities for forcing state
 * 
 * @internal - Not for production use
 */
export function useUpdateNotificationAdmin() {
  const baseState = useUpdateNotification()
  
  return {
    ...baseState,
    forceShow: () => {
      updateStorage.clearDismissal(CURRENT_VERSION.version)
      window.location.reload()
    },
    clearAll: () => {
      updateStorage.clearAll()
      window.location.reload()
    }
  }
}

