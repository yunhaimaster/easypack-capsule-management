'use client'

import { useCallback, useMemo, useState } from 'react'
import { ImportReviewDrawer } from '@/components/forms/import-review-drawer'
import { dryRunMerge, mergeIngredientsSmart, type IngredientItem } from '@/lib/import/merge'

export function useImportReview() {
  const [isOpen, setIsOpen] = useState(false)
  const [diff, setDiff] = useState<any>(null)
  const [context, setContext] = useState<{ current: IngredientItem[]; imported: IngredientItem[]; onApply: (merged: IngredientItem[]) => void } | null>(null)

  const openReview = useCallback((imported: IngredientItem[], current: IngredientItem[], onApply: (merged: IngredientItem[]) => void) => {
    const d = dryRunMerge(current, imported)
    setDiff(d)
    setContext({ current, imported, onApply })
    setIsOpen(true)
  }, [])

  const handleApply = useCallback((selectedIds: Set<string>, edits: Map<string, { name: string; value: number }>) => {
    if (!context) return
    
    // Apply edits to imported items before merging
    const editedImported = context.imported.map(item => {
      // Find the normalized name for this item to match with edits
      const normalizedName = item.materialName.trim().toLowerCase()
      const edit = Array.from(edits.entries()).find(([id]) => {
        // Check if this edit applies to this item
        return id === normalizedName || edits.has(item.materialName)
      })
      
      if (edit) {
        return {
          materialName: edit[1].name,
          unitContentMg: edit[1].value
        }
      }
      return item
    })
    
    const merged = mergeIngredientsSmart(context.current, editedImported, selectedIds, edits)
    context.onApply(merged)
    setIsOpen(false)
    setDiff(null)
    setContext(null)
  }, [context])

  const drawer = useMemo(() => (
    diff ? (
      <ImportReviewDrawer isOpen={isOpen} onOpenChange={setIsOpen} diff={diff} onApply={handleApply} />
    ) : null
  ), [diff, isOpen, handleApply])

  return { openReview, drawer }
}


