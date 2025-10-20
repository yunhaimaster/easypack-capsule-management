import { resolveAlias } from '@/lib/import/ingredient-alias'

export interface IngredientItem {
  materialName: string
  unitContentMg: number
}

export interface DiffRow {
  id: string
  name: string
  from?: number
  to?: number
  type: 'add' | 'update' | 'unchanged' | 'invalid'
}

export interface DiffResult {
  add: DiffRow[]
  update: DiffRow[]
  unchanged: DiffRow[]
  invalid: DiffRow[]
  all: DiffRow[]
}

export function normalizeIngredientName(name: string): string {
  if (!name) return ''
  // NFKC normalize to handle CJK and full-width chars
  const normalized = name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
  return resolveAlias(normalized)
}

export function parseUnitValue(value: string | number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(2)) : 0
  const raw = value.normalize('NFKC').trim().toLowerCase()
  if (!raw) return 0
  // Try mg/g/IU
  const mgMatch = raw.match(/([\d.]+)\s*mg/)
  if (mgMatch) return Number(parseFloat(mgMatch[1]).toFixed(2))
  const gMatch = raw.match(/([\d.]+)\s*g/)
  if (gMatch) return Number((parseFloat(gMatch[1]) * 1000).toFixed(2))
  const numberOnly = raw.match(/^([\d.]+)$/)
  if (numberOnly) return Number(parseFloat(numberOnly[1]).toFixed(2))
  // IU: vary by substance, keep as 0 to require explicit confirmation downstream
  const iuMatch = raw.match(/([\d.]+)\s*iu/)
  if (iuMatch) return 0
  return 0
}

export function dryRunMerge(current: IngredientItem[], imported: IngredientItem[]): DiffResult {
  const currentMap = new Map<string, IngredientItem>()
  current.forEach((c) => currentMap.set(normalizeIngredientName(c.materialName), c))

  const seen = new Set<string>()
  const rows: DiffRow[] = []

  for (const imp of imported) {
    const normName = normalizeIngredientName(imp.materialName)
    if (!normName) {
      rows.push({ id: `${rows.length}`, name: imp.materialName, type: 'invalid' })
      continue
    }
    if (seen.has(normName)) continue
    seen.add(normName)

    const currentItem = currentMap.get(normName)
    const to = Number(isFinite(imp.unitContentMg as number) ? imp.unitContentMg : 0)
    if (!currentItem) {
      rows.push({ id: normName, name: imp.materialName, to, type: to > 0 ? 'add' : 'invalid' })
    } else {
      const from = Number(currentItem.unitContentMg)
      if (to <= 0) {
        rows.push({ id: normName, name: imp.materialName, from, to, type: 'invalid' })
      } else if (Math.abs(from - to) < 1e-6) {
        rows.push({ id: normName, name: imp.materialName, from, to, type: 'unchanged' })
      } else {
        rows.push({ id: normName, name: imp.materialName, from, to, type: 'update' })
      }
    }
  }

  return {
    add: rows.filter(r => r.type === 'add'),
    update: rows.filter(r => r.type === 'update'),
    unchanged: rows.filter(r => r.type === 'unchanged'),
    invalid: rows.filter(r => r.type === 'invalid'),
    all: rows,
  }
}

export function mergeIngredientsSmart(
  current: IngredientItem[],
  imported: IngredientItem[],
  selectedIds: Set<string>
): IngredientItem[] {
  // Build lookup by normalized name for current
  const currentIndexByName = new Map<string, number>()
  const result = current.map((c, idx) => {
    currentIndexByName.set(normalizeIngredientName(c.materialName), idx)
    return { ...c }
  })

  const seen = new Set<string>()
  for (const imp of imported) {
    const normName = normalizeIngredientName(imp.materialName)
    if (!normName || seen.has(normName)) continue
    seen.add(normName)

    if (!selectedIds.has(normName)) continue

    const idx = currentIndexByName.get(normName)
    const to = Number(isFinite(imp.unitContentMg as number) ? imp.unitContentMg : 0)
    if (idx === undefined) {
      if (to > 0) {
        result.push({ materialName: imp.materialName, unitContentMg: to })
      }
    } else {
      if (to > 0) {
        result[idx] = { ...result[idx], unitContentMg: to }
      }
    }
  }

  return result
}


