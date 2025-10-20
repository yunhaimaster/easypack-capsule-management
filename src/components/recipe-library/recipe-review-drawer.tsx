'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconContainer } from '@/components/ui/icon-container'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/accessible-dialog'
import { useImportReview } from '@/hooks/use-import-review'
import { applyRecipeEdits, normalizeRecipeName, type ParsedRecipe, type RecipeEdit } from '@/lib/recipe/merge'
import { AlertTriangle, Check, Plus, Edit2, List } from 'lucide-react'

interface RecipeReviewDrawerProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  recipes: ParsedRecipe[]
  conflicts: Set<string>
  onApply: (selectedRecipes: ParsedRecipe[], edits: Map<string, RecipeEdit>) => void
}

export function RecipeReviewDrawer({ isOpen, onOpenChange, recipes, conflicts, onApply }: RecipeReviewDrawerProps) {
  // Generate IDs for recipes based on index
  const recipesWithIds = useMemo(() => 
    recipes.map((recipe, index) => ({
      ...recipe,
      id: `recipe-${index}`
    }))
  , [recipes])

  const [selected, setSelected] = useState<Set<string>>(() => {
    // Auto-select non-duplicate recipes
    return new Set(
      recipesWithIds
        .filter(r => !conflicts.has(normalizeRecipeName(r.recipeName)))
        .map(r => r.id)
    )
  })
  
  const [edits, setEdits] = useState<Map<string, RecipeEdit>>(new Map())
  const [editing, setEditing] = useState<string | null>(null)
  const [reviewingIngredientsId, setReviewingIngredientsId] = useState<string | null>(null)

  // Import review hook for nested ingredient review
  const { openReview: openIngredientReview, drawer: ingredientDrawer } = useImportReview()

  const counts = useMemo(() => ({
    total: recipesWithIds.length,
    new: recipesWithIds.filter(r => !conflicts.has(normalizeRecipeName(r.recipeName))).length,
    duplicate: recipesWithIds.filter(r => conflicts.has(normalizeRecipeName(r.recipeName))).length,
    selected: selected.size,
  }), [recipesWithIds, conflicts, selected])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulk = (mode: 'all' | 'new' | 'clear') => {
    if (mode === 'clear') {
      setSelected(new Set())
      return
    }
    if (mode === 'all') {
      setSelected(new Set(recipesWithIds.map(r => r.id)))
      return
    }
    if (mode === 'new') {
      setSelected(new Set(
        recipesWithIds
          .filter(r => !conflicts.has(normalizeRecipeName(r.recipeName)))
          .map(r => r.id)
      ))
      return
    }
  }

  const getDisplayValue = (recipeId: string) => {
    const recipe = recipesWithIds.find(r => r.id === recipeId)
    if (!recipe) return null
    
    const edit = edits.get(recipeId)
    if (edit) {
      return {
        recipeName: edit.recipeName ?? recipe.recipeName,
        description: edit.description ?? recipe.description,
        capsuleSize: edit.capsuleSize ?? recipe.capsuleSize,
        capsuleColor: edit.capsuleColor ?? recipe.capsuleColor,
        capsuleType: edit.capsuleType ?? recipe.capsuleType,
        ingredients: recipe.ingredients
      }
    }
    return recipe
  }

  const startEdit = (recipeId: string) => {
    const recipe = recipesWithIds.find(r => r.id === recipeId)
    if (!recipe) return
    
    if (!edits.has(recipeId)) {
      setEdits(new Map(edits.set(recipeId, {
        recipeName: recipe.recipeName,
        description: recipe.description,
        capsuleSize: recipe.capsuleSize,
        capsuleColor: recipe.capsuleColor,
        capsuleType: recipe.capsuleType,
      })))
    }
    setEditing(recipeId)
  }

  const updateEdit = (recipeId: string, field: keyof RecipeEdit, value: string) => {
    const current = edits.get(recipeId) || {}
    setEdits(new Map(edits.set(recipeId, { ...current, [field]: value })))
  }

  const cancelEdit = () => {
    setEditing(null)
  }

  const saveEdit = () => {
    setEditing(null)
  }

  const handleReviewIngredients = (recipeId: string) => {
    const recipe = recipesWithIds.find(r => r.id === recipeId)
    if (!recipe) return

    setReviewingIngredientsId(recipeId)
    openIngredientReview(
      recipe.ingredients,
      [], // Empty current (new recipe has no existing ingredients)
      (mergedIngredients) => {
        // Update recipe's ingredients with reviewed ones
        const recipeIndex = recipesWithIds.findIndex(r => r.id === recipeId)
        if (recipeIndex >= 0) {
          recipes[recipeIndex].ingredients = mergedIngredients
        }
        setReviewingIngredientsId(null)
      }
    )
  }

  const handleApply = () => {
    const selectedRecipes = recipesWithIds
      .filter(r => selected.has(r.id))
      .map(r => {
        const { id, ...recipe } = r
        return recipe as ParsedRecipe
      })
    
    const editedRecipes = applyRecipeEdits(selectedRecipes, edits)
    onApply(editedRecipes, edits)
  }

  const renderRecipeCard = (recipe: typeof recipesWithIds[0]) => {
    const isChecked = selected.has(recipe.id)
    const isEditing = editing === recipe.id
    const displayValue = getDisplayValue(recipe.id)
    const isDuplicate = conflicts.has(normalizeRecipeName(recipe.recipeName))
    const hasEdits = edits.has(recipe.id)

    if (!displayValue) return null

    if (isEditing) {
      return (
        <Card key={recipe.id} className="liquid-glass-card" interactive={false}>
          <div className="liquid-glass-content p-4 space-y-3 border-2 border-primary-400">
            <div className="flex items-center gap-3">
              <Checkbox checked={isChecked} onCheckedChange={() => toggle(recipe.id)} aria-label="選擇此配方" />
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs text-neutral-600 block mb-1">配方名稱 *</label>
                  <Input
                    value={displayValue.recipeName}
                    onChange={(e) => updateEdit(recipe.id, 'recipeName', e.target.value)}
                    className="h-8 text-sm"
                    placeholder="配方名稱"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 block mb-1">用途說明</label>
                  <Textarea
                    value={displayValue.description || ''}
                    onChange={(e) => updateEdit(recipe.id, 'description', e.target.value)}
                    className="text-sm min-h-[60px]"
                    placeholder="配方用途或說明"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-neutral-600 block mb-1">膠囊大小</label>
                    <Input
                      value={displayValue.capsuleSize || ''}
                      onChange={(e) => updateEdit(recipe.id, 'capsuleSize', e.target.value)}
                      className="h-8 text-sm"
                      placeholder="00"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 block mb-1">膠囊顏色</label>
                    <Input
                      value={displayValue.capsuleColor || ''}
                      onChange={(e) => updateEdit(recipe.id, 'capsuleColor', e.target.value)}
                      className="h-8 text-sm"
                      placeholder="白色"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-600 block mb-1">膠囊類型</label>
                    <Input
                      value={displayValue.capsuleType || ''}
                      onChange={(e) => updateEdit(recipe.id, 'capsuleType', e.target.value)}
                      className="h-8 text-sm"
                      placeholder="植物膠囊"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 text-xs">
                    取消
                  </Button>
                  <Button size="sm" onClick={saveEdit} className="h-7 text-xs">
                    完成
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )
    }

    return (
      <Card key={recipe.id} className="liquid-glass-card liquid-glass-card-interactive" interactive>
        <div className="liquid-glass-content p-4">
          <div className="flex items-start gap-3">
            <Checkbox checked={isChecked} onCheckedChange={() => toggle(recipe.id)} aria-label="選擇此配方" className="mt-1" />
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-neutral-800">
                      {displayValue.recipeName || '未命名配方'}
                    </h3>
                    {hasEdits && <Badge variant="outline" className="text-xs">已編輯</Badge>}
                    {isDuplicate && (
                      <Badge variant="outline" className="text-xs text-danger-600 border-danger-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        重複
                      </Badge>
                    )}
                  </div>
                  {displayValue.description && (
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{displayValue.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <List className="h-3 w-3" />
                  <span>{displayValue.ingredients.length} 項原料</span>
                </div>
                {displayValue.capsuleSize && (
                  <Badge variant="outline" className="text-xs">大小: {displayValue.capsuleSize}</Badge>
                )}
                {displayValue.capsuleColor && (
                  <Badge variant="outline" className="text-xs">顏色: {displayValue.capsuleColor}</Badge>
                )}
                {displayValue.capsuleType && (
                  <Badge variant="outline" className="text-xs">類型: {displayValue.capsuleType}</Badge>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReviewIngredients(recipe.id)}
                  className="h-8 text-xs"
                >
                  <List className="h-3 w-3 mr-1" />
                  審核原料
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEdit(recipe.id)}
                  className="h-8 text-xs"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  編輯配方
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配方導入審核</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
              <div className="liquid-glass-content p-4 flex flex-wrap items-center gap-2">
                <Badge>總計 {counts.total}</Badge>
                <Badge variant="outline" className="text-success-600">新配方 {counts.new}</Badge>
                {counts.duplicate > 0 && (
                  <Badge variant="outline" className="text-danger-600">重複 {counts.duplicate}</Badge>
                )}
                <div className="ml-auto text-xs text-neutral-600">已選 {counts.selected}</div>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => bulk('all')} className="text-xs">
                全選
              </Button>
              <Button variant="outline" onClick={() => bulk('new')} className="text-xs">
                只選新配方
              </Button>
              <Button variant="outline" onClick={() => bulk('clear')} className="text-xs">
                清除選擇
              </Button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {recipesWithIds.map(renderRecipeCard)}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleApply} disabled={selected.size === 0}>
                套用所選 ({selected.size} 個配方)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {ingredientDrawer}
    </>
  )
}

