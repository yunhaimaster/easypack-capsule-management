/**
 * Export Dialog Component for Scheduling Table
 * 
 * Allows users to export scheduling entries to CSV or XLSX format
 * with column selection.
 */

'use client'

import { useState, useEffect } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileDown, Loader2 } from 'lucide-react'
import { SCHEDULING_COLUMNS } from '@/lib/export/scheduling-exporter'
import { ManagerSchedulingEntry } from '@/types/manager-scheduling'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  entries: ManagerSchedulingEntry[]
}

type ExportFormat = 'csv' | 'xlsx'

export function ExportDialog({ isOpen, onClose, entries }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    Object.keys(SCHEDULING_COLUMNS)
  )
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allColumns = Object.entries(SCHEDULING_COLUMNS)

  // Reset selections when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedColumns(Object.keys(SCHEDULING_COLUMNS))
      setError(null)
    }
  }, [isOpen])

  const handleToggleColumn = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  const handleSelectAll = () => {
    setSelectedColumns(Object.keys(SCHEDULING_COLUMNS))
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
        columns: selectedColumns
      }

      const response = await fetch('/api/manager-scheduling/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
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
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `排單表_${new Date().toISOString().split('T')[0]}.${format}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }
      
      a.download = filename
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

  const exportScope = `全部 ${entries.length} 個排單項目`

  return (
    <LiquidGlassModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileDown className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white/95">匯出排單表</h2>
        </div>

        {/* Export Scope */}
        <div className="mb-6 p-4 bg-info-50 dark:bg-info-900/20 rounded-lg border border-info-200 dark:border-info-800">
          <p className="text-sm text-info-700 dark:text-info-300">
            <strong>匯出範圍：</strong>{exportScope}
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-3">
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
              <span className="text-neutral-700 dark:text-white/85">Excel (XLSX)</span>
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
              <span className="text-neutral-700 dark:text-white/85">CSV</span>
            </label>
          </div>
        </div>

        {/* Column Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-neutral-700 dark:text-white/85">
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
          
          <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-surface-primary/50 dark:bg-surface-secondary/30">
            <div className="grid grid-cols-2 gap-3">
              {allColumns.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-surface-secondary/50 dark:hover:bg-surface-secondary/50 rounded px-2 py-1 transition-colors">
                  <Checkbox
                    checked={selectedColumns.includes(key)}
                    onCheckedChange={() => handleToggleColumn(key)}
                  />
                  <span className="text-sm text-neutral-700 dark:text-white/85">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
            <p className="text-sm text-danger-700 dark:text-danger-300">{error}</p>
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
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
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
