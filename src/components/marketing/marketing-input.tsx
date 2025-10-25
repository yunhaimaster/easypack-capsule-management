'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'

interface Ingredient {
  materialName: string
  unitContentMg: number
}

interface MarketingInputProps {
  ingredients: Ingredient[]
  setIngredients: (ingredients: Ingredient[]) => void
}

export function MarketingInput({ ingredients, setIngredients }: MarketingInputProps) {
  const addIngredient = () => {
    setIngredients([...ingredients, { materialName: '', unitContentMg: 0 }])
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setIngredients(newIngredients)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex flex-col gap-4 md:flex-row md:items-center p-4 bg-surface-primary rounded-lg border border-neutral-200">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                原料名稱
              </label>
              <input
                type="text"
                value={ingredient.materialName}
                onChange={(e) => updateIngredient(index, 'materialName', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="輸入原料名稱"
              />
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                單粒重量 (mg)
              </label>
              <input
                type="number"
                value={ingredient.unitContentMg || ''}
                onChange={(e) => updateIngredient(index, 'unitContentMg', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="輸入重量"
              />
            </div>
            <div className="flex md:flex-shrink-0 md:pt-6">
              <button
                onClick={() => removeIngredient(index)}
                className="p-2 text-danger-600 hover:text-danger-800 hover:bg-danger-50 rounded-lg transition-colors self-start"
                disabled={ingredients.length === 1}
                aria-label="刪除原料"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={addIngredient}
          className="flex items-center gap-2 text-info-600 border-violet-300 hover:bg-info-50"
        >
          <Plus className="h-4 w-4" />
          新增原料
        </Button>
        <Badge variant="outline" className="text-xs text-neutral-500 dark:text-white/65">
          已輸入 {ingredients.length} 項原料
        </Badge>
      </div>
    </div>
  )
}

