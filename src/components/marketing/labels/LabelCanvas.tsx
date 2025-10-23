'use client'

import { LabelTemplate } from '@/types/label'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Grid3x3, Eye, EyeOff } from 'lucide-react'

interface LabelCanvasProps {
  template: LabelTemplate
  onChange?: (template: LabelTemplate) => void
  readonly?: boolean
}

export function LabelCanvas({ template, onChange, readonly = false }: LabelCanvasProps) {
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showGuides, setShowGuides] = useState(true)
  const [svgContent, setSvgContent] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Render SVG preview
    const renderSVG = async () => {
      try {
        const { renderLabelToSVG } = await import('@/lib/label-renderer')
        const svg = renderLabelToSVG(template, {
          showBleed: showGuides,
          showSafe: showGuides,
          showGuides: showGuides
        })
        setSvgContent(svg)
      } catch (error) {
        console.error('Failed to render label:', error)
      }
    }
    renderSVG()
  }, [template, showGuides])

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.25, 3))
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.25, 0.5))

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-neutral-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showGrid ? 'default' : 'outline'}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3x3 className="h-4 w-4 mr-1" />
            網格
          </Button>
          <Button
            size="sm"
            variant={showGuides ? 'default' : 'outline'}
            onClick={() => setShowGuides(!showGuides)}
          >
            {showGuides ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            參考線
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full bg-neutral-50 rounded-lg border-2 border-neutral-300 overflow-auto"
        style={{
          minHeight: '400px',
          maxHeight: '600px',
          backgroundImage: showGrid
            ? 'repeating-linear-gradient(0deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 10px), repeating-linear-gradient(90deg, #e5e7eb 0, #e5e7eb 1px, transparent 1px, transparent 10px)'
            : 'none',
          backgroundSize: showGrid ? '10px 10px' : 'auto'
        }}
      >
        <div
          className="inline-block p-8"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {svgContent ? (
            <div dangerouslySetInnerHTML={{ __html: svgContent }} />
          ) : (
            <div className="flex items-center justify-center w-full h-64 text-neutral-400">
              載入中...
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-neutral-600">
        <div>
          尺寸：{template.size.widthMm}mm × {template.size.heightMm}mm
        </div>
        <div>
          元素數量：{template.elements.length}
        </div>
        {template.size.bleedMm && (
          <div>
            出血：{template.size.bleedMm}mm | 安全區：{template.size.safeMm}mm
          </div>
        )}
      </div>

      {!readonly && (
        <div className="text-xs text-neutral-500 bg-primary-50 border border-primary-200 rounded-lg p-3">
          💡 提示：點擊「匯出」可下載完整的 SVG 或 PDF 檔案，並在 Illustrator 中進行進階編輯
        </div>
      )}
    </div>
  )
}

