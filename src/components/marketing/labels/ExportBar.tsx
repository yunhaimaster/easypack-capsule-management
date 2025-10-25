'use client'

import { LabelTemplate } from '@/types/label'
import { Button } from '@/components/ui/button'
import { Download, FileText, Image } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { useState } from 'react'

interface ExportBarProps {
  template: LabelTemplate | null
  disabled?: boolean
}

export function ExportBar({ template, disabled }: ExportBarProps) {
  const { showToast } = useToast()
  const [exporting, setExporting] = useState(false)

  const handleExportSVG = async () => {
    if (!template) return

    try {
      setExporting(true)
      const { exportLabelSVG, downloadSVG } = await import('@/lib/label-export')
      const svg = await exportLabelSVG(template, { format: 'svg' })
      
      const filename = `${template.name.replace(/\s+/g, '-')}-${Date.now()}.svg`
      downloadSVG(svg, filename)

      showToast({
        title: 'SVG 匯出成功',
        description: `${filename} 已下載，可直接在 Illustrator 中開啟編輯`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Export SVG failed:', error)
      showToast({
        title: '匯出失敗',
        description: '無法匯出 SVG 檔案，請稍後再試',
        variant: 'destructive'
      })
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!template) return

    try {
      setExporting(true)
      const { exportLabelSVG, convertSVGToPDFClient } = await import('@/lib/label-export')
      const svg = await exportLabelSVG(template, { format: 'pdf' })
      
      const filename = `${template.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`
      await convertSVGToPDFClient(svg, filename)

      showToast({
        title: 'PDF 匯出成功',
        description: `${filename} 已下載`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Export PDF failed:', error)
      showToast({
        title: 'PDF 匯出失敗',
        description: error instanceof Error ? error.message : '無法匯出 PDF 檔案',
        variant: 'destructive'
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="liquid-glass-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white/95">匯出標籤</h3>
          <p className="text-sm text-neutral-600 dark:text-white/75 mt-1">
            {template ? `準備匯出：${template.name}` : '請先選擇一個設計概念'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExportSVG}
            disabled={!template || disabled || exporting}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            匯出 SVG
          </Button>

          <Button
            onClick={handleExportPDF}
            disabled={!template || disabled || exporting}
            variant="default"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? '匯出中...' : '匯出 PDF'}
          </Button>
        </div>
      </div>

      {template && (
        <div className="mt-3 pt-3 border-t border-neutral-200 grid grid-cols-2 gap-3 text-xs text-neutral-600 dark:text-white/75">
          <div>
            <span className="font-medium">尺寸：</span>
            {template.size.widthMm}×{template.size.heightMm}mm
          </div>
          <div>
            <span className="font-medium">元素：</span>
            {template.elements.length} 個圖層
          </div>
          <div>
            <span className="font-medium">合規分數：</span>
            {template.metadata?.complianceScore || 'N/A'}
          </div>
          <div>
            <span className="font-medium">生成模型：</span>
            {template.metadata?.generatedBy || 'AI'}
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-neutral-500 dark:text-white/65 bg-amber-50 border border-amber-200 rounded-lg p-2">
        💡 SVG 檔案可在 Adobe Illustrator 中開啟，所有文字和圖形均為可編輯的向量格式
      </div>
    </div>
  )
}

