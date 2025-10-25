/**
 * Feature Flags for Dark Mode V2
 * 
 * This file manages feature flags for the new dark mode implementation.
 * Allows gradual rollout and easy rollback if issues arise.
 */

export const DARK_MODE_V2_ENABLED = process.env.NEXT_PUBLIC_DARK_MODE_V2 === 'true'

/**
 * Hook to determine which dark mode version to use
 * Allows localStorage override for testing
 */
export function useDarkModeVersion() {
  // Allow localStorage override for testing
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('dark-mode-version')
    if (override) return override === 'v2'
  }
  return DARK_MODE_V2_ENABLED
}

/**
 * Force enable dark mode V2 for testing
 * Call this in browser console: window.enableDarkModeV2()
 */
if (typeof window !== 'undefined') {
  (window as any).enableDarkModeV2 = () => {
    localStorage.setItem('dark-mode-version', 'v2')
    window.location.reload()
  }
  
  (window as any).disableDarkModeV2 = () => {
    localStorage.removeItem('dark-mode-version')
    window.location.reload()
  }
}