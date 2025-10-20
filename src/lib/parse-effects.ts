/**
 * Parse AI effects analysis text into individual effects
 * Handles patterns like "功效1、..." or "1、..." or plain comma-separated text
 */
export function parseEffects(text: string): string[] {
  if (!text || text.trim() === '') {
    return []
  }

  // Try to split by numbered patterns: 功效1、功效2、... or 1、2、...
  const patterns = [
    /功效\d+[、，]/g,  // Matches: 功效1、 or 功效2、
    /\d+[、，]/g,       // Matches: 1、 or 2、
  ]

  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 1) {
      // Split by the pattern and clean up
      const parts = text.split(pattern).filter(part => part.trim())
      
      // If we have valid splits, return them
      if (parts.length > 1) {
        return parts.map(part => part.trim()).filter(part => part.length > 0)
      }
    }
  }

  // Fallback: try splitting by spaces or multiple consecutive spaces
  const spaceSplit = text.split(/\s{2,}/).filter(part => part.trim().length > 10)
  if (spaceSplit.length > 1) {
    return spaceSplit.map(part => part.trim())
  }

  // Last resort: return the whole text as single effect
  return [text.trim()]
}

/**
 * Get a display summary for effects
 * Returns object with: firstEffect (truncated), remainingCount, allEffects
 */
export function getEffectsSummary(text: string, maxFirstLength: number = 60) {
  const effects = parseEffects(text)
  
  if (effects.length === 0) {
    return {
      firstEffect: '',
      remainingCount: 0,
      allEffects: [],
      hasMultiple: false
    }
  }

  const firstEffect = effects[0].length > maxFirstLength 
    ? effects[0].substring(0, maxFirstLength) + '...'
    : effects[0]

  return {
    firstEffect,
    remainingCount: effects.length - 1,
    allEffects: effects,
    hasMultiple: effects.length > 1
  }
}

/**
 * Effect categories for filtering recipes by health benefits
 * Updated: 2025-10-20 - Phase 1 Optimization
 */
export const EFFECT_CATEGORIES = {
  // === 基礎健康 ===
  sleep: {
    name: '睡眠放鬆',
    keywords: ['睡眠', '助眠', '放鬆', '舒壓', '安神', '鎮靜', '褪黑'],
    icon: 'Moon',
    color: 'purple',
    group: 'basic'
  },
  digest: {
    name: '腸道消化',
    keywords: ['腸道', '益生菌', '消化', '便秘', '腸胃', '排便', '菌群'],
    icon: 'Activity',
    color: 'green',
    group: 'basic'
  },
  immune: {
    name: '免疫增強',
    keywords: ['免疫', '抗氧化', '抵抗力', '防護', '維生素C', '鋅', '抗炎', '發炎', '過敏', '感冒'],
    icon: 'Shield',
    color: 'blue',
    group: 'basic'
  },
  energy: {
    name: '能量活力',
    keywords: ['能量', '活力', '疲勞', '提神', '精力', 'B群'],
    icon: 'Zap',
    color: 'orange',
    group: 'basic'
  },
  brain: {
    name: '腦部認知',
    keywords: ['記憶', '認知', '專注', '腦力', '智力', '思維', '學習', 'DHA', 'EPA', '銀杏', '腦部', '記憶力'],
    icon: 'Brain',
    color: 'violet',
    group: 'basic'
  },
  weight: {
    name: '體重管理',
    keywords: ['減重', '減肥', '瘦身', '代謝', '脂肪', '燃脂', '控重', '體重', '肥胖', '塑形'],
    icon: 'Scale',
    color: 'amber',
    group: 'basic'
  },
  
  // === 器官系統 ===
  bone: {
    name: '骨骼關節',
    keywords: ['骨骼', '關節', '鈣質', '軟骨', '維生素D', '葡萄糖胺'],
    icon: 'Bone',
    color: 'gray',
    group: 'organ'
  },
  cardio: {
    name: '心血管',
    keywords: ['心血管', '血壓', '血脂', '循環', '膽固醇', '心臟'],
    icon: 'Heart',
    color: 'red',
    group: 'organ'
  },
  vision: {
    name: '視力保健',
    keywords: ['視力', '眼睛', '葉黃素', '藍光', '視網膜'],
    icon: 'Eye',
    color: 'cyan',
    group: 'organ'
  },
  liver: {
    name: '肝臟保健',
    keywords: ['肝臟', '肝功能', '解毒', '護肝', '肝炎', '膽汁', '脂肪肝', '保肝'],
    icon: 'Droplet',
    color: 'teal',
    group: 'organ'
  },
  
  // === 美容抗衰 ===
  beauty: {
    name: '美容養顏',
    keywords: ['美容', '膠原蛋白', '抗衰老', '皮膚', '美白', '彈性'],
    icon: 'Sparkles',
    color: 'pink',
    group: 'beauty'
  },
  
  // === 性別專屬 ===
  women: {
    name: '女性保健',
    keywords: ['更年期', '月經', '荷爾蒙', '婦科', '經期'],
    icon: 'Flower',
    color: 'rose',
    group: 'gender'
  },
  men: {
    name: '男性保健',
    keywords: ['前列腺', '精力', '睾固酮'],
    icon: 'Target',
    color: 'indigo',
    group: 'gender'
  }
}

/**
 * Category groups for organizing filters
 */
export const CATEGORY_GROUPS = {
  basic: { name: '基礎健康', order: 1 },
  organ: { name: '器官系統', order: 2 },
  beauty: { name: '美容抗衰', order: 3 },
  gender: { name: '性別專屬', order: 4 }
}

/**
 * Get categories grouped by type
 */
export function getGroupedCategories() {
  const grouped: Record<string, Array<{ key: string; category: typeof EFFECT_CATEGORIES[keyof typeof EFFECT_CATEGORIES] }>> = {
    basic: [],
    organ: [],
    beauty: [],
    gender: []
  }

  Object.entries(EFFECT_CATEGORIES).forEach(([key, category]) => {
    const group = category.group || 'basic'
    grouped[group].push({ key, category })
  })

  return grouped
}

/**
 * Categorize effect text into health benefit categories
 */
export function categorizeEffect(effectText: string): string[] {
  const categories: string[] = []
  const lowerText = effectText.toLowerCase()
  
  Object.entries(EFFECT_CATEGORIES).forEach(([key, category]) => {
    if (category.keywords.some(keyword => lowerText.includes(keyword))) {
      categories.push(key)
    }
  })
  
  return categories.length > 0 ? categories : ['uncategorized']
}

/**
 * Get all effect categories for a recipe
 */
export function getRecipeCategories(aiEffectsAnalysis: string | null | undefined): string[] {
  if (!aiEffectsAnalysis) return []
  return categorizeEffect(aiEffectsAnalysis)
}

