/**
 * Common alias/synonym mappings for ingredient names.
 * Keys and values should be lowercase, trimmed, and normalized.
 */
export const INGREDIENT_ALIAS_MAP: Record<string, string> = {
  // English aliases
  'vit c': 'vitamin c',
  'vitamin c': 'vitamin c',
  'ascorbic acid': 'vitamin c',
  'vit d': 'vitamin d3',
  'vitamin d3': 'vitamin d3',
  'cholecalciferol': 'vitamin d3',
  'vit b12': 'vitamin b12',
  'cobalamin': 'vitamin b12',

  // Chinese aliases (normalized as lowercase english where possible)
  '抗壞血酸': 'vitamin c',
  '維生素c': 'vitamin c',
  '維他命c': 'vitamin c',
  '維生素d3': 'vitamin d3',
  '維他命d3': 'vitamin d3',
  '維生素b12': 'vitamin b12',
  '維他命b12': 'vitamin b12',
}

export function resolveAlias(normalizedName: string): string {
  const key = normalizedName.toLowerCase()
  return INGREDIENT_ALIAS_MAP[key] || key
}


