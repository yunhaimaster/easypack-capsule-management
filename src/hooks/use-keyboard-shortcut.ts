'use client'

import { useEffect, useCallback, useRef } from 'react'

interface KeyboardShortcutOptions {
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  preventDefault?: boolean
  enabled?: boolean
}

/**
 * Hook for registering keyboard shortcuts
 * Handles cross-platform detection (Cmd on Mac, Ctrl on Windows/Linux)
 * 
 * @param key - The key to listen for (e.g., 's', 'Enter', 'Escape')
 * @param callback - Function to call when shortcut is triggered
 * @param options - Additional configuration
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: KeyboardShortcutOptions = {}
) {
  const {
    ctrlKey = false,
    metaKey = false,
    shiftKey = false,
    altKey = false,
    preventDefault = true,
    enabled = true
  } = options

  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Check if key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase()
      if (!keyMatches) return

      // Check modifier keys
      const ctrlMatches = ctrlKey ? event.ctrlKey : true
      const metaMatches = metaKey ? event.metaKey : true
      const shiftMatches = shiftKey ? event.shiftKey : !event.shiftKey
      const altMatches = altKey ? event.altKey : !event.altKey

      // For Cmd+S or Ctrl+S, we want either Cmd (Mac) or Ctrl (Windows/Linux)
      // But not both, and not when neither is pressed
      if (key.toLowerCase() === 's' && (ctrlKey || metaKey)) {
        const hasModifier = event.metaKey || event.ctrlKey
        if (!hasModifier) return
        
        // Don't trigger if both are pressed (unusual case)
        if (event.metaKey && event.ctrlKey) return

        // Don't trigger if Shift or Alt are also pressed
        if (event.shiftKey || event.altKey) return
      } else {
        // For other shortcuts, check modifiers exactly
        if (!ctrlMatches || !metaMatches || !shiftMatches || !altMatches) return
      }

      // Don't trigger when user is typing in an input field
      // Exception: Allow Cmd+S / Ctrl+S even in inputs
      const target = event.target as HTMLElement
      const isInput = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isInput && !(key.toLowerCase() === 's' && (event.metaKey || event.ctrlKey))) {
        return
      }

      // Prevent default browser behavior
      if (preventDefault) {
        event.preventDefault()
      }

      // Execute callback
      callbackRef.current()
    },
    [key, ctrlKey, metaKey, shiftKey, altKey, preventDefault, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Convenience hook for save shortcut (Cmd+S on Mac, Ctrl+S on Windows/Linux)
 * Automatically detects platform
 */
export function useSaveShortcut(callback: () => void, enabled = true) {
  return useKeyboardShortcut('s', callback, {
    ctrlKey: true,
    metaKey: true,
    preventDefault: true,
    enabled
  })
}

/**
 * Convenience hook for escape key
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  return useKeyboardShortcut('Escape', callback, {
    preventDefault: false,
    enabled
  })
}

