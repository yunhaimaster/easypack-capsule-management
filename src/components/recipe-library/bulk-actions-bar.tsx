'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Download, Trash2, X } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  onBulkAnalyze: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
  analyzing?: boolean
}

export function BulkActionsBar({
  selectedCount,
  onBulkAnalyze,
  onBulkExport,
  onBulkDelete,
  onClearSelection,
  analyzing = false
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="liquid-glass-card liquid-glass-card-elevated shadow-apple-xl">
        <div className="liquid-glass-content px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Selection Count */}
            <div className="flex items-center gap-2">
              <Badge className="bg-primary-600 text-white">
                已選擇 {selectedCount} 個配方
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onBulkAnalyze}
                disabled={analyzing}
                className="h-9 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Brain className="h-4 w-4 mr-2" />
                批量分析
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onBulkExport}
                className="h-9"
              >
                <Download className="h-4 w-4 mr-2" />
                批量導出
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onBulkDelete}
                className="h-9 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                批量刪除
              </Button>
            </div>

            {/* Clear Selection */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="h-9"
            >
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

