/**
 * Accessible Form Components
 * Enhanced form controls with built-in accessibility features
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Form Field Container with proper label association
 */
interface FormFieldProps {
  /**
   * Unique ID for the input field
   */
  id: string
  /**
   * Label text
   */
  label: string
  /**
   * Error message to display
   */
  error?: string
  /**
   * Helper text to guide users
   */
  helperText?: string
  /**
   * Mark field as required
   */
  required?: boolean
  /**
   * Additional description for screen readers
   */
  ariaDescription?: string
  /**
   * Visually hide the label (but keep it accessible)
   */
  hiddenLabel?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  id,
  label,
  error,
  helperText,
  required = false,
  ariaDescription,
  hiddenLabel = false,
  children,
  className,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-helper` : undefined
  const descriptionId = ariaDescription ? `${id}-description` : undefined

  // Clone child and pass accessibility props
  const childWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': [errorId, helperId, descriptionId]
          .filter(Boolean)
          .join(' ') || undefined,
        'aria-required': required,
        ...(child.props || {}),
      } as any)
    }
    return child
  })

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={id}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          hiddenLabel && 'sr-only'
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-label="必填">
            *
          </span>
        )}
      </label>

      {ariaDescription && (
        <p id={descriptionId} className="sr-only">
          {ariaDescription}
        </p>
      )}

      {childWithProps}

      {helperText && !error && (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="text-xs text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Accessible Input with enhanced focus states
 */
export interface AccessibleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Show a clear button when input has value
   */
  clearable?: boolean
  /**
   * Callback when clear button is clicked
   */
  onClear?: () => void
}

export const AccessibleInput = React.forwardRef<
  HTMLInputElement,
  AccessibleInputProps
>(({ className, type, clearable, onClear, ...props }, ref) => {
  const [showClear, setShowClear] = React.useState(false)

  const handleClear = () => {
    onClear?.()
    setShowClear(false)
  }

  return (
    <div className="relative">
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
          'text-sm ring-offset-background file:border-0 file:bg-transparent',
          'file:text-sm file:font-medium placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive',
          clearable && 'pr-10',
          className
        )}
        ref={ref}
        onChange={(e) => {
          if (clearable) {
            setShowClear(e.target.value.length > 0)
          }
          props.onChange?.(e)
        }}
        {...props}
      />
      {clearable && showClear && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'rounded-md p-1 hover:bg-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary'
          )}
          aria-label="清除輸入"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
})
AccessibleInput.displayName = 'AccessibleInput'

/**
 * Accessible Select with proper ARIA attributes
 */
export interface AccessibleSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string; disabled?: boolean }>
  placeholder?: string
}

export const AccessibleSelect = React.forwardRef<
  HTMLSelectElement,
  AccessibleSelectProps
>(({ className, options, placeholder, ...props }, ref) => {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
        'text-sm ring-offset-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive',
        className
      )}
      ref={ref}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
})
AccessibleSelect.displayName = 'AccessibleSelect'

/**
 * Accessible Checkbox with enhanced visual feedback
 */
export interface AccessibleCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
}

export const AccessibleCheckbox = React.forwardRef<
  HTMLInputElement,
  AccessibleCheckboxProps
>(({ className, label, helperText, id, ...props }, ref) => {
  const generatedId = React.useId()
  const checkboxId = id || `checkbox-${generatedId}`
  const helperId = helperText ? `${checkboxId}-helper` : undefined

  return (
    <div className="flex items-start space-x-2">
      <input
        type="checkbox"
        id={checkboxId}
        ref={ref}
        aria-describedby={helperId}
        className={cn(
          'h-4 w-4 rounded border-gray-300',
          'text-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'cursor-pointer',
          className
        )}
        {...props}
      />
      <div className="flex flex-col">
        <label
          htmlFor={checkboxId}
          className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
        {helperText && (
          <p id={helperId} className="text-xs text-muted-foreground mt-1">
            {helperText}
          </p>
        )}
      </div>
    </div>
  )
})
AccessibleCheckbox.displayName = 'AccessibleCheckbox'

/**
 * Fieldset for grouping related form controls
 */
export interface FieldsetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: string
  /**
   * Visually hide the legend (but keep it accessible)
   */
  hiddenLegend?: boolean
}

export const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ className, legend, hiddenLegend = false, children, ...props }, ref) => {
    return (
      <fieldset
        ref={ref}
        className={cn('border border-gray-200 rounded-lg p-4 space-y-4', className)}
        {...props}
      >
        <legend
          className={cn(
            'text-sm font-medium px-2',
            hiddenLegend && 'sr-only'
          )}
        >
          {legend}
        </legend>
        {children}
      </fieldset>
    )
  }
)
Fieldset.displayName = 'Fieldset'

