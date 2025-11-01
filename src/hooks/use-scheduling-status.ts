import { useState, useEffect, useCallback } from 'react'

interface SchedulingStatus {
  [workOrderId: string]: {
    isInScheduling: boolean
    entryId: string | null
  }
}

/**
 * Custom hook to batch fetch scheduling status for multiple work orders
 * Reduces N individual API calls to a single batch call
 */
export function useSchedulingStatus(
  workOrderIds: string[],
  options?: { enabled?: boolean; skip?: boolean }
) {
  const { enabled = true, skip = false } = options || {}
  // Start with undefined to indicate not loaded yet
  const [status, setStatus] = useState<SchedulingStatus | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchStatus = useCallback(async (ids: string[]) => {
    if (!enabled || skip || ids.length === 0) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/manager-scheduling/check-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ workOrderIds: ids })
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data.data || {})
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch scheduling status')
      }
    } catch (err) {
      console.warn('Failed to batch fetch scheduling status:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      // Set empty object on error to signal "attempted but failed"
      setStatus({})
    } finally {
      setIsLoading(false)
    }
  }, [enabled, skip])

  useEffect(() => {
    if (!skip && enabled && workOrderIds.length > 0) {
      fetchStatus(workOrderIds)
    }
  }, [workOrderIds.join(','), enabled, skip, fetchStatus])

  return {
    status,
    isLoading,
    error,
    refetch: () => fetchStatus(workOrderIds)
  }
}

