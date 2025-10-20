'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconContainer } from '@/components/ui/icon-container'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/accessible-dialog'
import type { DiffResult, DiffRow } from '@/lib/import/merge'
import { AlertTriangle, Check, Plus, Minus, Edit2 } from 'lucide-react'

function diffPercentage(from: number, to: number): number {
  if (from === 0) return to > 0 ? 100 : 0
  return ((to - from) / from) * 100
}

interface ImportReviewDrawerProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  diff: DiffResult
  onApply: (selectedIds: Set<string>, edits: Map<string, { name: string; value: number }>) => void
}

export function ImportReviewDrawer({ isOpen, onOpenChange, diff, onApply }: ImportReviewDrawerProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(diff.add.concat(diff.update).map(r => r.id)))
  const [editing, setEditing] = useState<string | null>(null)
  const [edits, setEdits] = useState<Map<string, { name: string; value: number }>>(new Map())

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

  const getDisplayValue = (row: DiffRow) => {
    const edit = edits.get(row.id)
    if (edit) return { name: edit.name, value: edit.value }
    return { name: row.name, value: row.to ?? row.from ?? 0 }
  }

  const startEdit = (row: DiffRow) => {
    const current = getDisplayValue(row)
    if (!edits.has(row.id)) {
      setEdits(new Map(edits.set(row.id, current)))
    }
    setEditing(row.id)
  }

  const updateEdit = (id: string, field: 'name' | 'value', newValue: string) => {
    const current = edits.get(id) || getDisplayValue(diff.all.find(r => r.id === id)!)
    const updated = { ...current, [field]: field === 'value' ? parseFloat(newValue) || 0 : newValue }
    setEdits(new Map(edits.set(id, updated)))
  }

  const cancelEdit = () => {
    setEditing(null)
  }

  const saveEdit = () => {
    setEditing(null)
  }

  const renderRow = (row: DiffRow) => {
    const isChecked = selected.has(row.id)
    const isEditing = editing === row.id
    const displayValue = getDisplayValue(row)
    
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
    const pct = (isUpdate && row.from != null && row.to != null) ? diffPercentage(row.from!, displayValue.value) : 0

    if (isEditing) {
      return (
        <div key={row.id} className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary-400 bg-primary-50">
          <Checkbox checked={isChecked} onCheckedChange={() => toggle(row.id)} aria-label="選擇此項目" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-600 w-12">名稱</label>
              <Input
                value={displayValue.name}
                onChange={(e) => updateEdit(row.id, 'name', e.target.value)}
                className="flex-1 h-8 text-sm"
                placeholder="原料名稱"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-600 w-12">含量</label>
              <Input
                type="number"
                value={displayValue.value}
                onChange={(e) => updateEdit(row.id, 'value', e.target.value)}
                className="flex-1 h-8 text-sm"
                placeholder="0"
                step="any"
              />
              <span className="text-xs text-neutral-600">mg</span>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 text-xs">取消</Button>
              <Button size="sm" onClick={saveEdit} className="h-7 text-xs">完成</Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div key={row.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <Checkbox checked={isChecked} onCheckedChange={() => toggle(row.id)} aria-label="選擇此項目" />
          <IconContainer icon={isAdd ? Plus : isUpdate ? Check : Minus} variant={isAdd ? 'success' : isUpdate ? 'warning' : 'neutral'} size="sm" />
          <div className="flex-1">
            <div className="text-sm font-medium text-neutral-800">
              {displayValue.name}
              {edits.has(row.id) && <Badge variant="outline" className="ml-2 text-xs">已編輯</Badge>}
            </div>
            <div className="text-xs text-neutral-600">
              {isAdd && (<span>新增 → <span className="font-medium">{displayValue.value} mg</span></span>)}
              {row.type === 'unchanged' && (<span>不變：{displayValue.value} mg</span>)}
              {isUpdate && (
                <span>
                  {row.from} mg → <span className="font-medium">{displayValue.value} mg</span>
                  <span className={`ml-2 ${pct >= 0 ? 'text-success-600' : 'text-danger-600'}`}>({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startEdit(row)}
          className="h-8 w-8 p-0"
          title="編輯"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
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
            <Button onClick={() => onApply(selected, edits)} disabled={selected.size === 0}>
              套用所選 {edits.size > 0 && `(${edits.size} 項已編輯)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


