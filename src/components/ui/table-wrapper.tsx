import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * TableWrapper - 統一的表格容器組件
 * 為桌面版數據表格提供一致的液態玻璃外觀
 */

interface TableWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 子元素（通常是 <table> 元素）
   */
  children: React.ReactNode
}

export const TableWrapper = React.forwardRef<HTMLDivElement, TableWrapperProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        variant="table"
        interactive={false}
        className={cn(className)}
        {...props}
      >
        {children}
      </Card>
    )
  }
)

TableWrapper.displayName = "TableWrapper"

/**
 * 使用範例：
 * 
 * <TableWrapper>
 *   <table className="min-w-full">
 *     <thead>...</thead>
 *     <tbody>...</tbody>
 *   </table>
 * </TableWrapper>
 */






