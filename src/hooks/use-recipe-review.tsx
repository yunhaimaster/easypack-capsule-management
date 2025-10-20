'use client'

import { useCallback, useMemo, useState } from 'react'
import { RecipeReviewDrawer } from '@/components/recipe-library/recipe-review-drawer'
import { checkDuplicateRecipes, type ParsedRecipe, type RecipeEdit } from '@/lib/recipe/merge'

export function useRecipeReview() {
  const [isOpen, setIsOpen] = useState(false)
  const [recipes, setRecipes] = useState<ParsedRecipe[]>([])
  const [conflicts, setConflicts] = useState<Set<string>>(new Set())
  const [context, setContext] = useState<{ onApply: (recipes: ParsedRecipe[]) => void } | null>(null)

  const openReview = useCallback(async (
    importedRecipes: ParsedRecipe[],
    onApply: (recipes: ParsedRecipe[]) => void
  ) => {
    // Check for duplicate recipe names
    const duplicates = await checkDuplicateRecipes(importedRecipes)
    
    setRecipes(importedRecipes)
    setConflicts(duplicates)
    setContext({ onApply })
    setIsOpen(true)
  }, [])

  const handleApply = useCallback((
    selectedRecipes: ParsedRecipe[],
    edits: Map<string, RecipeEdit>
  ) => {
    if (!context) return

    context.onApply(selectedRecipes)
    setIsOpen(false)
    setRecipes([])
    setConflicts(new Set())
    setContext(null)
  }, [context])

  const drawer = useMemo(() => (
    recipes.length > 0 ? (
      <RecipeReviewDrawer
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        recipes={recipes}
        conflicts={conflicts}
        onApply={handleApply}
      />
    ) : null
  ), [recipes, conflicts, isOpen, handleApply])

  return { openReview, drawer }
}

