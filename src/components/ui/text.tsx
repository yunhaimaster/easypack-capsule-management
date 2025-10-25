import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Unified Text Components
 * All text components handle their own dark mode internally
 * Pages should use these instead of manual dark: classes
 */

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof React.JSX.IntrinsicElements
}

// Primary text - main content, headings
export const TextPrimary = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Component = "p", ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "text-neutral-800 dark:text-white/95",
          className
        )}
        {...props}
      />
    )
  }
)
TextPrimary.displayName = "TextPrimary"

// Secondary text - descriptions, subtitles
export const TextSecondary = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Component = "p", ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "text-neutral-600 dark:text-white/75",
          className
        )}
        {...props}
      />
    )
  }
)
TextSecondary.displayName = "TextSecondary"

// Tertiary text - metadata, captions
export const TextTertiary = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Component = "p", ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "text-neutral-500 dark:text-white/65",
          className
        )}
        {...props}
      />
    )
  }
)
TextTertiary.displayName = "TextTertiary"

// Muted text - disabled, placeholder-like
export const TextMuted = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Component = "p", ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "text-neutral-400 dark:text-white/55",
          className
        )}
        {...props}
      />
    )
  }
)
TextMuted.displayName = "TextMuted"

// Success text - positive states
export const TextSuccess = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Component = "p", ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "text-success-600 dark:text-success-400",
          className
        )}
        {...props}
      />
    )
  }
)
TextSuccess.displayName = "TextSuccess"

// Warning text - caution states
export const TextWarning = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Component = "p", ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "text-warning-600 dark:text-warning-400",
          className
        )}
        {...props}
      />
    )
  }
)
TextWarning.displayName = "TextWarning"

// Danger text - error states
export const TextDanger = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Component = "p", ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "text-danger-600 dark:text-danger-400",
          className
        )}
        {...props}
      />
    )
  }
)
TextDanger.displayName = "TextDanger"

// Info text - informational states
export const TextInfo = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as: Component = "p", ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "text-info-600 dark:text-info-400",
          className
        )}
        {...props}
      />
    )
  }
)
TextInfo.displayName = "TextInfo"

// Convenience object for easy access
export const Text = {
  Primary: TextPrimary,
  Secondary: TextSecondary,
  Tertiary: TextTertiary,
  Muted: TextMuted,
  Success: TextSuccess,
  Warning: TextWarning,
  Danger: TextDanger,
  Info: TextInfo,
}

/**
 * Usage Examples:
 * 
 * // Basic usage
 * <Text.Primary>Main content</Text.Primary>
 * <Text.Secondary>Description text</Text.Secondary>
 * <Text.Tertiary>Metadata</Text.Tertiary>
 * <Text.Muted>Disabled text</Text.Muted>
 * 
 * // With semantic HTML
 * <Text.Primary as="h1">Page Title</Text.Primary>
 * <Text.Secondary as="h2">Section Title</Text.Secondary>
 * <Text.Tertiary as="span">Inline metadata</Text.Tertiary>
 * 
 * // With additional classes
 * <Text.Primary className="font-bold">Bold primary text</Text.Primary>
 * <Text.Secondary className="text-sm">Small secondary text</Text.Secondary>
 * 
 * // State colors
 * <Text.Success>Success message</Text.Success>
 * <Text.Warning>Warning message</Text.Warning>
 * <Text.Danger>Error message</Text.Danger>
 * <Text.Info>Info message</Text.Info>
 */
