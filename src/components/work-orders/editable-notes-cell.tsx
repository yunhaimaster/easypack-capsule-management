/**
 * Editable Notes Cell Component
 * 
 * Allows inline editing of work order notes with multi-line textarea
 * - Click to edit (shows textarea)
 * - Multi-line display with line-clamp-3 for preview
 * - Auto-save on blur
 * - Enter key saves (Shift+Enter for new line)
 * - Escape key cancels and reverts
 * - Loading state during save
 * - Optimistic updates
 * - Rollback on error
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { workOrderKeys } from '@/lib/queries/work-orders'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface EditableNotesCellProps {
  workOrderId: string
  currentNotes: string | null | undefined
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function EditableNotesCell({ 
  workOrderId, 
  currentNotes, 
  onSuccess,
  onError 
}: EditableNotesCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempNotes, setTempNotes] = useState(currentNotes || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  // Sync with prop changes
  useEffect(() => {
    setTempNotes(currentNotes || '')
  }, [currentNotes])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes || null })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失敗')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch work orders
      queryClient.invalidateQueries({ queryKey: workOrderKeys.lists() })
      setIsEditing(false)
      onSuccess?.()
    },
    onError: (error: Error) => {
      // Rollback to original notes
      setTempNotes(currentNotes || '')
      setIsEditing(false)
      onError?.(error)
    }
  })

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Select all text for easier replacement
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmedNotes = tempNotes.trim()
    // If unchanged, just exit edit mode
    if (trimmedNotes === (currentNotes || '')) {
      setIsEditing(false)
      return
    }
    updateMutation.mutate(trimmedNotes)
  }

  const handleCancel = () => {
    setTempNotes(currentNotes || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter key saves (unless Shift is held for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTempNotes(e.target.value)
  }

  if (isEditing || updateMutation.isPending) {
    return (
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          value={tempNotes}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={updateMutation.isPending}
          className={cn(
            "w-full min-h-[60px] max-h-[120px] px-2 py-1.5 text-sm",
            "border border-primary-300 dark:border-primary-600 rounded",
            "bg-surface-primary dark:bg-elevation-1",
            "text-neutral-900 dark:text-white/95",
            "focus:outline-none focus:ring-2 focus:ring-primary-500",
            "resize-y",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          placeholder="輸入備註..."
          aria-label="編輯備註"
        />
        
        {updateMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-primary/80 dark:bg-elevation-0/80 rounded">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600 dark:text-primary-400" />
          </div>
        )}

        {!updateMutation.isPending && (
          <div className="absolute -top-6 right-0 flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSave()
              }}
              className="p-1 rounded text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20"
              aria-label="儲存"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCancel()
              }}
              className="p-1 rounded text-neutral-400 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="取消"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Display mode
  const displayText = currentNotes?.trim() || '-'
  const isEmpty = !currentNotes?.trim()

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setIsEditing(true)
      }}
      className={cn(
        "group relative w-full text-left",
        "transition-all hover:bg-surface-secondary/50 dark:hover:bg-elevation-1/50 rounded px-1 py-0.5"
      )}
      aria-label={isEmpty ? "點擊添加備註" : "點擊編輯備註"}
      role="button"
      tabIndex={0}
    >
      {isEmpty ? (
        <span className="text-sm text-neutral-400 dark:text-white/50 italic">點擊添加備註</span>
      ) : (
        <div className="text-sm text-neutral-700 dark:text-white/85 line-clamp-3 group-hover:line-clamp-none">
          {displayText}
        </div>
      )}
      
      {/* Edit indicator on hover */}
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-3 w-3 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center">
          <Pencil className="h-2 w-2 text-white" />
        </div>
      </div>
    </button>
  )
}

