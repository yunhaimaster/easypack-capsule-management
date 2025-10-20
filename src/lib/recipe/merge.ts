/**
 * Recipe merge utilities for Phase 2: Recipe Library Import Review
 * Handles recipe name normalization, duplicate detection, and edit application
 */

export interface ParsedIngredient {
  materialName: string
  unitContentMg: number
}

export interface ParsedRecipe {
  recipeName: string
  description?: string
  ingredients: ParsedIngredient[]
  capsuleSize?: string
  capsuleColor?: string
  capsuleType?: string
  confidence?: '高' | '中' | '低'
  needsConfirmation?: boolean
}

export interface RecipeEdit {
  recipeName?: string
  description?: string
  capsuleSize?: string
  capsuleColor?: string
  capsuleType?: string
}

/**
 * Normalize recipe name for comparison
 * Similar to ingredient normalization but for recipe names
 */
export function normalizeRecipeName(name: string): string {
  if (!name) return ''
  // NFKC normalize to handle CJK and full-width chars
  return name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Check if recipes have duplicate names in the database
 * Returns a Set of normalized recipe names that already exist
 */
export async function checkDuplicateRecipes(
  recipes: ParsedRecipe[]
): Promise<Set<string>> {
  try {
    const recipeNames = recipes.map(r => r.recipeName).filter(Boolean)
    
    if (recipeNames.length === 0) {
      return new Set()
    }

    const response = await fetch('/api/recipes/check-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeNames })
    })

    if (!response.ok) {
      console.error('Failed to check duplicate recipes')
      return new Set()
    }

    const result = await response.json()
    
    // Result should be { duplicates: string[] }
    if (result.success && Array.isArray(result.duplicates)) {
      return new Set(result.duplicates.map(normalizeRecipeName))
    }

    return new Set()
  } catch (error) {
    console.error('Error checking duplicate recipes:', error)
    return new Set()
  }
}

/**
 * Apply edits to recipes
 * Merges user edits (from RecipeReviewDrawer) with original parsed recipes
 */
export function applyRecipeEdits(
  recipes: ParsedRecipe[],
  edits: Map<string, RecipeEdit>
): ParsedRecipe[] {
  return recipes.map((recipe, index) => {
    const recipeId = `recipe-${index}` // Use index as ID for mapping
    const edit = edits.get(recipeId)
    
    if (!edit) {
      return recipe
    }

    return {
      ...recipe,
      recipeName: edit.recipeName !== undefined ? edit.recipeName : recipe.recipeName,
      description: edit.description !== undefined ? edit.description : recipe.description,
      capsuleSize: edit.capsuleSize !== undefined ? edit.capsuleSize : recipe.capsuleSize,
      capsuleColor: edit.capsuleColor !== undefined ? edit.capsuleColor : recipe.capsuleColor,
      capsuleType: edit.capsuleType !== undefined ? edit.capsuleType : recipe.capsuleType,
    }
  })
}

/**
 * Check if a single recipe name is a duplicate
 * Used for real-time validation during editing
 */
export function isDuplicateRecipe(
  recipeName: string,
  existingDuplicates: Set<string>
): boolean {
  const normalized = normalizeRecipeName(recipeName)
  return existingDuplicates.has(normalized)
}

