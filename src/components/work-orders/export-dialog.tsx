/**
 * Export Dialog Component
 * 
 * Allows users to export work orders to CSV or XLSX format
 * with column selection.
 */

'use client'

import { useState } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileDown, Loader2 } from 'lucide-react'
import { WORK_ORDER_COLUMNS } from '@/lib/export/xlsx-exporter'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  totalCount: number
}

type ExportFormat = 'csv' | 'xlsx'

export function ExportDialog({ isOpen, onClose, selectedIds, totalCount }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    Object.keys(WORK_ORDER_COLUMNS)
  )
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allColumns = Object.entries(WORK_ORDER_COLUMNS)

  const handleToggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  const handleSelectAll = () => {
    setSelectedColumns(Object.keys(WORK_ORDER_COLUMNS))
  }

  const handleDeselectAll = () => {
    setSelectedColumns([])
  }

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setError('請至少選擇一個欄位')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const requestBody = {
        format,
        columns: selectedColumns,
        workOrderIds: selectedIds.length > 0 ? selectedIds : undefined,
        includeLinkedOrders: false,
        encoding: 'utf8-bom' as const
      }

      const response = await fetch('/api/work-orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '匯出失敗')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `work-orders-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      onClose()
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : '匯出失敗，請稍後重試')
    } finally {
      setIsExporting(false)
    }
  }

  const exportScope = selectedIds.length > 0
    ? `已選擇的 ${selectedIds.length} 個工作單`
    : `全部 ${totalCount} 個工作單`

  return (
    <LiquidGlassModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileDown className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-neutral-900">匯出工作單</h2>
        </div>

        {/* Export Scope */}
        <div className="mb-6 p-4 bg-info-50 rounded-lg border border-info-200">
          <p className="text-sm text-info-700">
            <strong>匯出範圍：</strong>{exportScope}
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            選擇格式
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="xlsx"
                checked={format === 'xlsx'}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-neutral-700">Excel (XLSX)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-neutral-700">CSV</span>
            </label>
          </div>
        </div>

        {/* Column Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-neutral-700">
              選擇欄位（{selectedColumns.length} / {allColumns.length}）
            </label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                全選
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="text-xs"
              >
                全不選
              </Button>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              {allColumns.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedColumns.includes(key)}
                    onCheckedChange={() => handleToggleColumn(key)}
                  />
                  <span className="text-sm text-neutral-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            取消
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                匯出中...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                匯出
              </>
            )}
          </Button>
        </div>
      </div>
    </LiquidGlassModal>
  )
}

