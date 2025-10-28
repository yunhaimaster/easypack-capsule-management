/**
 * Bulk Action Bar Component
 * 
 * Sticky bar that appears when work orders are selected
 * Provides bulk operations: Export, Delete, Status Update
 * 
 * Features:
 * - Responsive design (stacks on mobile)
 * - Accessible with proper ARIA labels
 * - Visual feedback for selection count
 */

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileDown, Trash2, RefreshCw, X } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onExport: () => void
  onDelete: () => void
  onStatusChange: () => void
  onClearSelection: () => void
}

export function BulkActionBar({
  selectedCount,
  onExport,
  onDelete,
  onStatusChange,
  onClearSelection
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div 
      className="fixed top-28 sm:top-24 left-0 right-0 z-20 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 p-4 shadow-md"
      role="region"
      aria-label="批量操作工具列"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="info" className="text-base px-4 py-2">
            已選擇 {selectedCount} 項
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearSelection}
            aria-label="清除全部選擇"
          >
            <X className="h-4 w-4 mr-2" />
            清除選擇
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExport}
            aria-label={`匯出選中的 ${selectedCount} 個工作單`}
          >
            <FileDown className="h-4 w-4 mr-2" />
            匯出選中項
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onStatusChange}
            aria-label={`變更選中的 ${selectedCount} 個工作單的狀態`}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            變更狀態
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDelete} 
            className="text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 border-danger-200"
            aria-label={`刪除選中的 ${selectedCount} 個工作單`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            刪除選中項
          </Button>
        </div>
      </div>
    </div>
  )
}

