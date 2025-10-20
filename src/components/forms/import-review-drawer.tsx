'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconContainer } from '@/components/ui/icon-container'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/accessible-dialog'
import type { DiffResult, DiffRow } from '@/lib/import/merge'
import { AlertTriangle, Check, Plus, Minus } from 'lucide-react'

function diffPercentage(from: number, to: number): number {
  if (from === 0) return to > 0 ? 100 : 0
  return ((to - from) / from) * 100
}

interface ImportReviewDrawerProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  diff: DiffResult
  onApply: (selectedIds: Set<string>) => void
}

export function ImportReviewDrawer({ isOpen, onOpenChange, diff, onApply }: ImportReviewDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(diff.add.concat(diff.update).map(r => r.id)))

  const counts = useMemo(() => ({
    add: diff.add.length,
    update: diff.update.length,
    unchanged: diff.unchanged.length,
    invalid: diff.invalid.length,
    selected: selected.size,
  }), [diff, selected])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const bulk = (mode: 'all' | 'adds' | 'updates' | 'clear') => {
    if (mode === 'clear') { setSelected(new Set()); return }
    if (mode === 'all') { setSelected(new Set(diff.add.concat(diff.update).map(r => r.id))); return }
    if (mode === 'adds') { setSelected(new Set(diff.add.map(r => r.id))); return }
    if (mode === 'updates') { setSelected(new Set(diff.update.map(r => r.id))); return }
  }

  const renderRow = (row: DiffRow) => {
    const isChecked = selected.has(row.id)
    if (row.type === 'invalid') {
      return (
        <div key={row.id} className="flex items-center justify-between p-3 rounded-lg border border-danger-200 bg-danger-50">
          <div className="flex items-center gap-3">
            <IconContainer icon={AlertTriangle} variant="danger" size="sm" />
            <div>
              <div className="text-sm font-medium text-red-700">{row.name || '無名稱原料'}</div>
              <div className="text-xs text-red-600">無效數值，將被略過</div>
            </div>
          </div>
        </div>
      )
    }

    const isAdd = row.type === 'add'
    const isUpdate = row.type === 'update'
    const pct = (isUpdate && row.from != null && row.to != null) ? diffPercentage(row.from!, row.to!) : 0

    return (
      <div key={row.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center gap-3">
          <Checkbox checked={isChecked} onCheckedChange={() => toggle(row.id)} aria-label="選擇此項目" />
          <IconContainer icon={isAdd ? Plus : isUpdate ? Check : Minus} variant={isAdd ? 'success' : isUpdate ? 'warning' : 'neutral'} size="sm" />
          <div>
            <div className="text-sm font-medium text-neutral-800">{row.name}</div>
            <div className="text-xs text-neutral-600">
              {isAdd && (<span>新增 → <span className="font-medium">{row.to} mg</span></span>)}
              {row.type === 'unchanged' && (<span>不變：{row.to} mg</span>)}
              {isUpdate && (
                <span>
                  {row.from} mg → <span className="font-medium">{row.to} mg</span>
                  <span className={`ml-2 ${pct >= 0 ? 'text-success-600' : 'text-danger-600'}`}>({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>導入審核與合併</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
            <div className="liquid-glass-content p-4 flex flex-wrap items-center gap-2">
              <Badge>新增 {counts.add}</Badge>
              <Badge variant="outline">更新 {counts.update}</Badge>
              <Badge variant="outline">不變 {counts.unchanged}</Badge>
              <Badge variant="outline" className="text-red-600">無效 {counts.invalid}</Badge>
              <div className="ml-auto text-xs text-neutral-600">已選 {counts.selected}</div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => bulk('all')}>全選</Button>
            <Button variant="outline" onClick={() => bulk('adds')}>只選新增</Button>
            <Button variant="outline" onClick={() => bulk('updates')}>只選更新</Button>
            <Button variant="outline" onClick={() => bulk('clear')}>清除選擇</Button>
          </div>

          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {diff.add.map(renderRow)}
            {diff.update.map(renderRow)}
            {diff.unchanged.map(renderRow)}
            {diff.invalid.map(renderRow)}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={() => onApply(selected)} disabled={selected.size === 0}>套用所選</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


