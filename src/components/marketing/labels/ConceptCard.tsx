'use client'

import { LabelConcept } from '@/types/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Download, Edit, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface ConceptCardProps {
  concept: LabelConcept
  onSelect: () => void
  onExport: (format: 'svg' | 'pdf') => void
  onImprove?: () => void
  isSelected?: boolean
}

export function ConceptCard({ concept, onSelect, onExport, onImprove, isSelected }: ConceptCardProps) {
  const [imageError, setImageError] = useState(false)
  
  const { template, svgPreview, compliance, score, palette, typography } = concept
  const passCount = compliance.checklist.filter(c => c.status === 'pass').length
  const totalCount = compliance.checklist.length

  return (
    <div
      className={`liquid-glass-card p-4 space-y-3 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      {/* Preview */}
      <div className="relative aspect-[140/60] bg-neutral-50 rounded-lg overflow-hidden border border-neutral-200">
        {!imageError ? (
          <div 
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: svgPreview }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
            預覽載入失敗
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        {/* Title & Score */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-neutral-900">{template.name}</h4>
          <Badge variant={score >= 80 ? 'default' : score >= 60 ? 'secondary' : 'destructive'}>
            {score} 分
          </Badge>
        </div>

        {/* Compliance */}
        <div className="flex items-center gap-2 text-xs">
          {compliance.passed ? (
            <CheckCircle2 className="h-4 w-4 text-success-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          )}
          <span className="text-neutral-600">
            合規檢查：{passCount}/{totalCount}
          </span>
        </div>

        {/* Palette */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-600">色系：</span>
          <div className="flex gap-1">
            {palette.slice(0, 4).map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded border border-neutral-300"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="text-xs text-neutral-600">
          字體：{typography.primary.split(',')[0]}
        </div>

        {/* Metadata */}
        {template.metadata?.generatedBy && (
          <div className="text-xs text-neutral-500">
            由 {template.metadata.generatedBy} 生成
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-neutral-200">
        <Button
          size="sm"
          variant={isSelected ? 'default' : 'outline'}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="flex-1"
        >
          <Edit className="h-3.5 w-3.5 mr-1" />
          {isSelected ? '已選擇' : '選擇'}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onExport('svg')
          }}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          SVG
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onExport('pdf')
          }}
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          PDF
        </Button>

        {onImprove && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onImprove()
            }}
            title="AI 改進設計"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Compliance Details (collapsible on hover) */}
      {!compliance.passed && (
        <div className="text-xs space-y-1 pt-2 border-t border-neutral-200">
          <p className="font-medium text-neutral-700">需改進項目：</p>
          {compliance.checklist
            .filter(c => c.status !== 'pass')
            .slice(0, 3)
            .map((item, idx) => (
              <div key={idx} className="flex items-start gap-1 text-neutral-600">
                <AlertCircle className="h-3 w-3 mt-0.5 text-amber-500" />
                <span>{item.item}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

