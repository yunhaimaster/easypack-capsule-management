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

  const handleApply = useCallback((selectedIds: Set<string>) => {
    if (!context) return
    const merged = mergeIngredientsSmart(context.current, context.imported, selectedIds)
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


