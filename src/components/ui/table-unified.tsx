import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Unified Table Components
 * All table components handle their own dark mode internally
 * Pages should use these instead of manual dark: classes
 */

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /**
   * Whether the table should have hover effects on rows
   */
  hoverable?: boolean
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Whether this row is interactive (clickable)
   */
  interactive?: boolean
}

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {
  /**
   * Text variant for the cell content
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'muted'
}

// Main table container
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, hoverable = true, ...props }, ref) => {
    return (
      <table
        ref={ref}
        className={cn(
          "w-full",
          "bg-white dark:bg-elevation-0",
          "border border-neutral-200 dark:border-white/10",
          "rounded-lg overflow-hidden",
          hoverable && "hover:shadow-apple-md transition-shadow",
          className
        )}
        {...props}
      />
    )
  }
)
Table.displayName = "Table"

// Table header
export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn(
          "bg-neutral-50 dark:bg-elevation-0/80",
          "border-b border-neutral-200 dark:border-white/10",
          className
        )}
        {...props}
      />
    )
  }
)
TableHeader.displayName = "TableHeader"

// Table body
export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn(
          "divide-y divide-neutral-200 dark:divide-white/10",
          className
        )}
        {...props}
      />
    )
  }
)
TableBody.displayName = "TableBody"

// Table row
export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b border-neutral-100 dark:border-white/10",
          interactive && "hover:bg-neutral-50 dark:hover:bg-elevation-1 cursor-pointer transition-colors",
          className
        )}
        {...props}
      />
    )
  }
)
TableRow.displayName = "TableRow"

// Table header cell
export const TableHead = React.forwardRef<HTMLTableCellElement, React.HTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          "px-4 py-3 text-left text-sm font-medium",
          "text-neutral-900 dark:text-white/95",
          "border-r border-neutral-200 dark:border-white/10 last:border-r-0",
          className
        )}
        {...props}
      />
    )
  }
)
TableHead.displayName = "TableHead"

// Table cell with text variants
export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variantClasses = {
      primary: "text-neutral-900 dark:text-white/95",
      secondary: "text-neutral-700 dark:text-white/85",
      tertiary: "text-neutral-600 dark:text-white/75",
      muted: "text-neutral-500 dark:text-white/65",
    }

    return (
      <td
        ref={ref}
        className={cn(
          "px-4 py-3 text-sm",
          variantClasses[variant],
          "border-r border-neutral-200 dark:border-white/10 last:border-r-0",
          className
        )}
        {...props}
      />
    )
  }
)
TableCell.displayName = "TableCell"

// Table footer
export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        className={cn(
          "bg-neutral-50 dark:bg-elevation-0/80",
          "border-t border-neutral-200 dark:border-white/10",
          className
        )}
        {...props}
      />
    )
  }
)
TableFooter.displayName = "TableFooter"

// Convenience object for easy access
export const TableComponents = {
  Table,
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Footer: TableFooter,
}

/**
 * Usage Examples:
 * 
 * // Basic table
 * <TableComponents.Table>
 *   <TableComponents.Header>
 *     <TableComponents.Row>
 *       <TableComponents.Head>Name</TableComponents.Head>
 *       <TableComponents.Head>Status</TableComponents.Head>
 *     </TableComponents.Row>
 *   </TableComponents.Header>
 *   <TableComponents.Body>
 *     <TableComponents.Row interactive>
 *       <TableComponents.Cell variant="primary">John Doe</TableComponents.Cell>
 *       <TableComponents.Cell variant="secondary">Active</TableComponents.Cell>
 *     </TableComponents.Row>
 *   </TableComponents.Body>
 * </TableComponents.Table>
 * 
 * // With different text variants
 * <TableComponents.Cell variant="primary">Main content</TableComponents.Cell>
 * <TableComponents.Cell variant="secondary">Secondary info</TableComponents.Cell>
 * <TableComponents.Cell variant="tertiary">Metadata</TableComponents.Cell>
 * <TableComponents.Cell variant="muted">Disabled text</TableComponents.Cell>
 */
