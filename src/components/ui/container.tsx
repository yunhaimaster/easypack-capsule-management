import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Unified Container Components
 * All container components handle their own dark mode internally
 * Pages should use these instead of manual dark: classes
 */

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the container should be interactive (hover effects)
   */
  interactive?: boolean
}

// Page-level container - full screen background
export const ContainerPage = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen",
          "bg-neutral-50 dark:bg-elevation-0",
          className
        )}
        {...props}
      />
    )
  }
)
ContainerPage.displayName = "ContainerPage"

// Section container - elevated surface
export const ContainerSection = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white dark:bg-elevation-1",
          "border border-neutral-200 dark:border-white/10",
          "rounded-lg",
          interactive && "hover:bg-neutral-50 dark:hover:bg-elevation-2 transition-colors",
          className
        )}
        {...props}
      />
    )
  }
)
ContainerSection.displayName = "ContainerSection"

// Card container - elevated card surface
export const ContainerCard = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, interactive = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white dark:bg-elevation-1",
          "border border-neutral-200 dark:border-white/10",
          "rounded-lg shadow-apple-md",
          interactive && "hover:shadow-apple-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer",
          className
        )}
        {...props}
      />
    )
  }
)
ContainerCard.displayName = "ContainerCard"

// Elevated container - higher elevation
export const ContainerElevated = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white dark:bg-elevation-2",
          "border border-neutral-200 dark:border-white/10",
          "rounded-lg shadow-apple-lg",
          interactive && "hover:shadow-apple-xl hover:-translate-y-1 transition-all duration-300",
          className
        )}
        {...props}
      />
    )
  }
)
ContainerElevated.displayName = "ContainerElevated"

// Flat container - no elevation
export const ContainerFlat = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white dark:bg-elevation-1",
          "border border-neutral-200 dark:border-white/10",
          "rounded-lg",
          interactive && "hover:bg-neutral-50 dark:hover:bg-elevation-2 transition-colors",
          className
        )}
        {...props}
      />
    )
  }
)
ContainerFlat.displayName = "ContainerFlat"

// Content container - for text content
export const ContainerContent = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "p-6",
          "text-neutral-800 dark:text-white/95",
          className
        )}
        {...props}
      />
    )
  }
)
ContainerContent.displayName = "ContainerContent"

// Header container - for section headers
export const ContainerHeader = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4",
          "bg-neutral-50 dark:bg-elevation-0",
          "border-b border-neutral-200 dark:border-white/10",
          className
        )}
        {...props}
      />
    )
  }
)
ContainerHeader.displayName = "ContainerHeader"

// Footer container - for section footers
export const ContainerFooter = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4",
          "bg-neutral-50 dark:bg-elevation-0",
          "border-t border-neutral-200 dark:border-white/10",
          className
        )}
        {...props}
      />
    )
  }
)
ContainerFooter.displayName = "ContainerFooter"

// Convenience object for easy access
export const Container = {
  Page: ContainerPage,
  Section: ContainerSection,
  Card: ContainerCard,
  Elevated: ContainerElevated,
  Flat: ContainerFlat,
  Content: ContainerContent,
  Header: ContainerHeader,
  Footer: ContainerFooter,
}

/**
 * Usage Examples:
 * 
 * // Page layout
 * <Container.Page>
 *   <Container.Section>
 *     <Container.Header>
 *       <h1>Section Title</h1>
 *     </Container.Header>
 *     <Container.Content>
 *       <p>Section content</p>
 *     </Container.Content>
 *   </Container.Section>
 * </Container.Page>
 * 
 * // Card layout
 * <Container.Card interactive>
 *   <Container.Content>
 *     <h2>Card Title</h2>
 *     <p>Card content</p>
 *   </Container.Content>
 * </Container.Card>
 * 
 * // Elevated content
 * <Container.Elevated>
 *   <Container.Content>
 *     <h2>Important Content</h2>
 *     <p>This content has higher elevation</p>
 *   </Container.Content>
 * </Container.Elevated>
 */
