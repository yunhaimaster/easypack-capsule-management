/**
 * React Query Hooks for Work Orders
 * 
 * Provides type-safe queries and mutations with optimistic updates,
 * cache invalidation, and proper error handling.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { WorkOrder, WorkOrderSearchFilters, CreateWorkOrderData, UpdateWorkOrderData, BulkUpdateData, ExportOptions, ImportData } from '@/types/work-order'

// ===== Cache Keys =====

export const workOrderKeys = {
  all: ['work-orders'] as const,
  lists: () => [...workOrderKeys.all, 'list'] as const,
  list: (filters: WorkOrderSearchFilters) => [...workOrderKeys.lists(), filters] as const,
  details: () => [...workOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...workOrderKeys.details(), id] as const,
  users: ['users', 'list'] as const,
}

// ===== API Functions =====

async function fetchWorkOrders(filters: WorkOrderSearchFilters) {
  const params = new URLSearchParams()
  
  if (filters.keyword) params.append('keyword', filters.keyword)
  if (filters.customerName) params.append('customerName', filters.customerName)
  if (filters.personInCharge) filters.personInCharge.forEach(id => params.append('personInCharge', id))
  if (filters.workType) filters.workType.forEach(type => params.append('workType', type))
  if (filters.status) filters.status.forEach(status => params.append('status', status))
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.append('dateTo', filters.dateTo)
  params.append('page', String(filters.page || 1))
  params.append('limit', String(filters.limit || 25))
  params.append('sortBy', filters.sortBy || 'createdAt')
  params.append('sortOrder', filters.sortOrder || 'desc')
  
  const response = await fetch(`/api/work-orders?${params.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '查詢工作單失敗')
  }
  return response.json()
}

async function fetchWorkOrder(id: string) {
  const response = await fetch(`/api/work-orders/${id}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '查詢工作單失敗')
  }
  const result = await response.json()
  return result.data
}

async function createWorkOrder(data: CreateWorkOrderData) {
  const response = await fetch('/api/work-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '建立工作單失敗')
  }
  const result = await response.json()
  return result.data
}

async function updateWorkOrder(id: string, data: UpdateWorkOrderData) {
  const response = await fetch(`/api/work-orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '更新工作單失敗')
  }
  const result = await response.json()
  return result.data
}

async function deleteWorkOrder(id: string) {
  const response = await fetch(`/api/work-orders/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '刪除工作單失敗')
  }
  return response.json()
}

async function bulkUpdateWorkOrders(data: BulkUpdateData) {
  const response = await fetch('/api/work-orders/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '批量更新失敗')
  }
  return response.json()
}

async function fetchUsers() {
  const response = await fetch('/api/users/list')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '查詢用戶列表失敗')
  }
  const result = await response.json()
  return result.data
}

// ===== Query Hooks =====

/**
 * Fetch paginated list of work orders with filters
 */
export function useWorkOrders(
  filters: WorkOrderSearchFilters,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: workOrderKeys.list(filters),
    queryFn: () => fetchWorkOrders(filters),
    staleTime: 30_000, // 30 seconds
    refetchInterval: 300_000, // Auto-refresh every 5 minutes
    ...options
  })
}

/**
 * Fetch single work order with all details
 */
export function useWorkOrder(
  id: string,
  options?: Omit<UseQueryOptions<WorkOrder>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: workOrderKeys.detail(id),
    queryFn: () => fetchWorkOrder(id),
    staleTime: 60_000, // 60 seconds
    enabled: !!id, // Only fetch if ID is provided
    ...options
  })
}

/**
 * Fetch list of users for dropdowns
 */
export function useUsers(
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: workOrderKeys.users,
    queryFn: fetchUsers,
    staleTime: 5 * 60_000, // 5 minutes (users don't change frequently)
    ...options
  })
}

// ===== Mutation Hooks =====

/**
 * Create new work order
 */
export function useCreateWorkOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      // Invalidate all list queries to show new order
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
    }
  })
}

/**
 * Update work order with optimistic updates
 */
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkOrderData }) => 
      updateWorkOrder(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }: { id: string; data: UpdateWorkOrderData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: workOrderKeys.detail(id) })
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(workOrderKeys.detail(id))
      
      // Optimistically update cache
      queryClient.setQueryData(workOrderKeys.detail(id), (old: WorkOrder | undefined) => {
        if (!old) return old
        return {
          ...old,
          ...data,
          updatedAt: new Date().toISOString()
        }
      })
      
      return { previous, id }
    },
    
    // Rollback on error
    onError: (_err: Error, variables: { id: string; data: UpdateWorkOrderData }, context: { previous: unknown; id: string } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(workOrderKeys.detail(context.id), context.previous)
      }
    },
    
    // Refetch after mutation settles
    onSettled: (_data: WorkOrder | undefined, _error: Error | null, variables: { id: string; data: UpdateWorkOrderData }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
    }
  })
}

/**
 * Delete work order
 */
export function useDeleteWorkOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteWorkOrder,
    onSuccess: (_data: unknown, id: string) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: workOrderKeys.detail(id) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
    }
  })
}

/**
 * Bulk update multiple work orders
 */
export function useBulkUpdateWorkOrders() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: bulkUpdateWorkOrders,
    onSuccess: () => {
      // Invalidate all work order queries (bulk affects multiple orders)
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
    }
  })
}

/**
 * Export work orders
 */
export function useExportWorkOrders() {
  return useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await fetch('/api/work-orders/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '匯出失敗')
      }
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? decodeURIComponent(contentDisposition.split('filename=')[1].replace(/"/g, ''))
        : `工作單匯出_${new Date().toISOString().slice(0, 10)}.${options.format}`
      
      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      return { success: true, filename }
    }
  })
}

/**
 * Import work orders
 */
export function useImportWorkOrders() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { data: ImportData; userMappings?: Record<string, string>; dryRun?: boolean }) => {
      const response = await fetch('/api/work-orders/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '匯入失敗')
      }
      
      return response.json()
    },
    onSuccess: (result: { dryRun?: boolean }) => {
      // Only invalidate if not a dry run
      if (!result.dryRun) {
        queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
      }
    }
  })
}

