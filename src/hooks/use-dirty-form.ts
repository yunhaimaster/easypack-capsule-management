'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'

/**
 * Deep equality check for comparing form values
 * Handles objects, arrays, and primitive values
 */
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    if (!deepEqual(obj1[key], obj2[key])) return false
  }

  return true
}

interface UseDirtyFormOptions {
  enableBeforeUnload?: boolean
  debounceMs?: number
}

/**
 * Hook for tracking form dirty state (unsaved changes)
 * Works with React Hook Form
 * 
 * @param form - React Hook Form instance
 * @param initialData - Initial form data to compare against
 * @param options - Configuration options
 */
export function useDirtyForm<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  initialData: T,
  options: UseDirtyFormOptions = {}
) {
  const {
    enableBeforeUnload = true,
    debounceMs = 300
  } = options

  const [isDirty, setIsDirty] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const successfulSaveRef = useRef(false)
  const handlerRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null)

  // Watch all form values
  const currentValues = form.watch()

  // Check if form is dirty
  const checkDirty = useCallback(() => {
    if (successfulSaveRef.current) return false
    if (!isInitialized) return false

    const dirty = !deepEqual(currentValues, initialData)
    return dirty
  }, [currentValues, initialData, isInitialized])

  // Update dirty state with debounce
  useEffect(() => {
    // Skip first render to avoid false positives
    if (!isInitialized) {
      setIsInitialized(true)
      return
    }

    // Skip if save was successful
    if (successfulSaveRef.current) {
      setIsDirty(false)
      return
    }

    const timer = setTimeout(() => {
      const dirty = checkDirty()
      setIsDirty(dirty)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [currentValues, checkDirty, debounceMs, isInitialized])

  // Browser warning for unsaved changes
  useEffect(() => {
    if (!enableBeforeUnload) return
    if (!isDirty) {
      // Clean up listener if it exists when isDirty becomes false
      if (handlerRef.current) {
        window.removeEventListener('beforeunload', handlerRef.current)
        handlerRef.current = null
      }
      return
    }
    if (successfulSaveRef.current) return // Don't show warning after successful save

    // Handler checks ref at execution time (not creation time)
    // This is critical - refs don't have closure issues, so it reads current value
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check ref at event time - if save was successful, don't warn
      if (successfulSaveRef.current) {
        return // Allow navigation without warning
      }
      
      e.preventDefault()
      // Modern browsers ignore custom messages and show default warning
      e.returnValue = ''
      return ''
    }

    handlerRef.current = handleBeforeUnload

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (handlerRef.current) {
        window.removeEventListener('beforeunload', handlerRef.current)
        handlerRef.current = null
      }
    }
  }, [isDirty, enableBeforeUnload])

  // Reset dirty state (call after successful save)
  // Immediately removes event listener to prevent race condition
  const resetDirty = useCallback(() => {
    successfulSaveRef.current = true
    setIsDirty(false)
    
    // Immediately remove listener to prevent beforeunload warning
    // This is critical because React state updates are async
    if (handlerRef.current) {
      window.removeEventListener('beforeunload', handlerRef.current)
      handlerRef.current = null
    }
  }, [])

  return {
    isDirty,
    resetDirty,
    checkDirty
  }
}

/**
 * Simplified version that works with any state management
 * Compare current state with initial state
 */
export function useSimpleDirtyCheck<T>(
  currentValue: T,
  initialValue: T,
  options: UseDirtyFormOptions = {}
) {
  const {
    enableBeforeUnload = true,
    debounceMs = 300
  } = options

  const [isDirty, setIsDirty] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      return
    }

    const timer = setTimeout(() => {
      const dirty = !deepEqual(currentValue, initialValue)
      setIsDirty(dirty)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [currentValue, initialValue, debounceMs, isInitialized])

  // Browser warning
  useEffect(() => {
    if (!enableBeforeUnload || !isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, enableBeforeUnload])

  const resetDirty = useCallback(() => {
    setIsDirty(false)
  }, [])

  return { isDirty, resetDirty }
}

