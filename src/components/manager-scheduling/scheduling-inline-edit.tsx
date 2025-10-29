/**
 * Inline Edit Component for Scheduling Table Fields
 * 
 * Handles inline editing with auto-save on blur for:
 * - Text fields
 * - Textarea fields
 * - Number fields
 * - Checkbox fields
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SchedulingInlineEditProps {
  entryId: string
  field: string
  value: string | number | boolean | null
  type: 'text' | 'textarea' | 'number' | 'checkbox'
  canEdit: boolean
  onSave: (entryId: string, field: string, value: string | number | boolean | null) => Promise<void>
  isLoading: boolean
  className?: string
}

export function SchedulingInlineEdit({
  entryId,
  field,
  value,
  type,
  canEdit,
  onSave,
  isLoading,
  className
}: SchedulingInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [hasChanges, setHasChanges] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text' || type === 'textarea') {
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

    await onSave(entryId, field, editValue)
    setIsEditing(false)
    setHasChanges(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' 
      ? parseFloat(e.target.value) || 0
      : type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
    
    setEditValue(newValue)
    setHasChanges(newValue !== value)
  }

  if (!canEdit) {
    // Read-only display
    if (type === 'checkbox') {
      return (
        <span className={cn("text-sm", className)}>
          {value ? '是' : '否'}
        </span>
      )
    }
    
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {type === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue as string}
            onChange={handleChange}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[60px] px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
        ) : type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={editValue as boolean}
            onChange={handleChange}
            onBlur={handleSave}
            className="h-4 w-4"
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
            className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
        )}
        
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="p-1 text-success-600 hover:bg-success-50 rounded"
              title="儲存"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-danger-600 hover:bg-danger-50 rounded"
              title="取消"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Display mode (clickable to edit)
  return (
    <div
      className={cn(
        "flex items-start gap-2",
        !isEditing && canEdit && "group cursor-pointer",
        className
      )}
      onClick={!isEditing ? handleStartEdit : undefined}
    >
      {type === 'checkbox' ? (
        <span className="text-sm">{value ? '是' : '否'}</span>
      ) : type === 'textarea' ? (
        <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {value || '-'}
        </div>
      ) : (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {value ?? '-'}
        </span>
      )}
      
      {!isEditing && canEdit && (
        <Pencil className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
      )}
    </div>
  )
}

