/**
 * Inline Edit Component for Work Order Table Fields
 * 
 * Handles inline editing with auto-save on blur for:
 * - Text fields
 * - Textarea fields
 * - Number fields
 * - Date fields
 * - Select dropdowns
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface WorkOrderInlineEditProps {
  workOrderId: string
  field: string
  value: string | number | boolean | null
  type: 'text' | 'textarea' | 'number' | 'date' | 'select'
  canEdit: boolean
  onSave: (workOrderId: string, field: string, value: string | number | boolean | null) => Promise<void>
  isLoading: boolean
  className?: string
  options?: Array<{ value: string; label: string }> // For select type
}

export function WorkOrderInlineEdit({
  workOrderId,
  field,
  value,
  type,
  canEdit,
  onSave,
  isLoading,
  className,
  options = []
}: WorkOrderInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [hasChanges, setHasChanges] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current && type !== 'select') {
      inputRef.current.focus()
      if (type === 'text' && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  const handleStartEdit = () => {
    if (!canEdit || isLoading) return
    setIsEditing(true)
    setHasChanges(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(value)
    setHasChanges(false)
  }

  const handleSave = async () => {
    if (!hasChanges) {
      setIsEditing(false)
      return
    }

    await onSave(workOrderId, field, editValue)
    setIsEditing(false)
    setHasChanges(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea' && type !== 'select') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' 
      ? parseFloat(e.target.value) || 0
      : e.target.value
    
    setEditValue(newValue)
    setHasChanges(newValue !== value)
  }

  const handleSelectChange = (newValue: string) => {
    setEditValue(newValue)
    setHasChanges(newValue !== value)
    // Auto-save select changes immediately
    if (canEdit && !isLoading) {
      onSave(workOrderId, field, newValue).then(() => {
        setIsEditing(false)
        setHasChanges(false)
      })
    }
  }

  if (!canEdit) {
    // Read-only display
    if (type === 'textarea') {
      return (
        <div className={cn("text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2", className)}>
          {value || '-'}
        </div>
      )
    }
    
    return (
      <span className={cn("text-sm text-neutral-600 dark:text-neutral-400", className)}>
        {value ?? '-'}
      </span>
    )
  }

  if (isEditing && type !== 'select') {
    return (
      <div className="relative w-full">
        {type === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue as string}
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full min-h-[60px] max-h-[120px] px-2 py-1.5 text-sm",
              "border border-primary-300 dark:border-primary-600 rounded",
              "bg-surface-primary dark:bg-elevation-1",
              "text-neutral-900 dark:text-white/95",
              "focus:outline-none focus:ring-2 focus:ring-primary-500",
              "resize-y",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={isLoading}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={editValue as string | number}
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full px-2 py-1.5 text-sm",
              "border border-primary-300 dark:border-primary-600 rounded",
              "bg-surface-primary dark:bg-elevation-1",
              "text-neutral-900 dark:text-white/95",
              "focus:outline-none focus:ring-2 focus:ring-primary-500",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={isLoading}
          />
        )}
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-primary/80 dark:bg-elevation-0/80 rounded">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600 dark:text-primary-400" />
          </div>
        )}

        {!isLoading && (
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

  // Display mode (clickable to edit)
  if (type === 'select') {
    return (
      <Select
        value={value as string || ''}
        onValueChange={handleSelectChange}
        disabled={isLoading || !canEdit}
      >
        <SelectTrigger 
          className={cn(
            "h-auto px-2 py-1 text-sm border border-transparent",
            canEdit && "hover:border-primary-300 cursor-pointer",
            className
          )}
          onClick={(e) => {
            if (canEdit && !isLoading && !isEditing) {
              e.stopPropagation()
            }
          }}
        >
          <SelectValue placeholder="選擇" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value} className="text-xs">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div
      className={cn(
        "group relative w-full cursor-pointer",
        !isEditing && canEdit && "hover:bg-surface-secondary/50 dark:hover:bg-elevation-1/50",
        className
      )}
      onClick={!isEditing && canEdit ? handleStartEdit : undefined}
    >
      {type === 'textarea' ? (
        <div className="text-sm text-neutral-700 dark:text-white/85 line-clamp-2">
          {value || '-'}
        </div>
      ) : (
        <span className="text-sm text-neutral-700 dark:text-white/85">
          {value ?? '-'}
        </span>
      )}
      
      {!isEditing && canEdit && (
        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-3 w-3 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center">
            <Pencil className="h-2 w-2 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}

