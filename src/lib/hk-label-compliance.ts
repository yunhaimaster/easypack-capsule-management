// Hong Kong Label Compliance Helper
// Black-box: encapsulates HK health supplement labeling rules

import { LabelTemplate, TextElement, HKComplianceData } from '@/types/label'
import { nanoid } from 'nanoid'

export interface ComplianceCheckResult {
  item: string
  status: 'pass' | 'warning' | 'fail'
  message?: string
}

export interface ComplianceReport {
  passed: boolean
  score: number // 0-100
  checklist: ComplianceCheckResult[]
}

const REQUIRED_ELEMENTS_HK = [
  { id: 'product-name', label: '產品名稱 (中文或中英雙語)', priority: 'required' },
  { id: 'net-content', label: '淨含量 (如 60粒)', priority: 'required' },
  { id: 'usage', label: '使用方法', priority: 'required' },
  { id: 'caution', label: '注意事項或警示語', priority: 'required' },
  { id: 'storage', label: '存放方式', priority: 'recommended' },
  { id: 'manufacturer', label: '製造商或進口商名稱及地址', priority: 'required' },
  { id: 'made-in-hk', label: '製造地標示 (香港製造)', priority: 'required' },
  { id: 'not-medicine', label: '非藥物聲明', priority: 'required' },
  { id: 'batch-expiry', label: '批次號及有效期', priority: 'recommended' },
]

export function validateHK(template: LabelTemplate): ComplianceReport {
  const checklist: ComplianceCheckResult[] = []
  const texts = template.elements.filter(el => el.kind === 'text').map(el => (el as TextElement).text.toLowerCase())

  // Check product name
  const hasProductName = texts.some(t => t.length > 2)
  checklist.push({
    item: '產品名稱',
    status: hasProductName ? 'pass' : 'fail',
    message: hasProductName ? undefined : '缺少產品名稱'
  })

  // Check net content
  const hasNetContent = texts.some(t => t.includes('粒') || t.includes('g') || t.includes('ml') || t.includes('淨含量'))
  checklist.push({
    item: '淨含量',
    status: hasNetContent ? 'pass' : 'fail',
    message: hasNetContent ? undefined : '缺少淨含量標示'
  })

  // Check usage
  const hasUsage = texts.some(t => t.includes('用法') || t.includes('每日') || t.includes('服用'))
  checklist.push({
    item: '使用方法',
    status: hasUsage ? 'pass' : 'warning',
    message: hasUsage ? undefined : '建議添加使用方法'
  })

  // Check caution
  const hasCaution = texts.some(t => t.includes('注意') || t.includes('警') || t.includes('孕婦') || t.includes('兒童'))
  checklist.push({
    item: '注意事項',
    status: hasCaution ? 'pass' : 'warning',
    message: hasCaution ? undefined : '建議添加注意事項'
  })

  // Check storage
  const hasStorage = texts.some(t => t.includes('存放') || t.includes('儲存') || t.includes('陰涼') || t.includes('密封'))
  checklist.push({
    item: '存放方式',
    status: hasStorage ? 'pass' : 'warning',
    message: hasStorage ? undefined : '建議添加存放方式'
  })

  // Check manufacturer
  const hasManufacturer = texts.some(t => t.includes('製造') || t.includes('地址') || t.includes('香港'))
  checklist.push({
    item: '製造商資訊',
    status: hasManufacturer ? 'pass' : 'fail',
    message: hasManufacturer ? undefined : '缺少製造商或地址'
  })

  // Check made in HK
  const hasMadeInHK = texts.some(t => t.includes('香港製造') || t.includes('made in hong kong') || t.includes('made in hk'))
  checklist.push({
    item: '香港製造標示',
    status: hasMadeInHK ? 'pass' : 'fail',
    message: hasMadeInHK ? undefined : '缺少「香港製造」標示'
  })

  // Check not medicine disclaimer
  const hasDisclaimer = texts.some(t => 
    t.includes('非藥物') || 
    t.includes('不能替代藥物') || 
    t.includes('not medicine') ||
    t.includes('not intended to diagnose')
  )
  checklist.push({
    item: '非藥物聲明',
    status: hasDisclaimer ? 'pass' : 'fail',
    message: hasDisclaimer ? undefined : '缺少非藥物聲明'
  })

  // Check batch/expiry
  const hasBatchExpiry = texts.some(t => t.includes('批次') || t.includes('有效期') || t.includes('batch') || t.includes('exp'))
  checklist.push({
    item: '批次及有效期',
    status: hasBatchExpiry ? 'pass' : 'warning',
    message: hasBatchExpiry ? undefined : '建議添加批次號及有效期'
  })

  const failCount = checklist.filter(c => c.status === 'fail').length
  const passCount = checklist.filter(c => c.status === 'pass').length
  const score = Math.round((passCount / checklist.length) * 100)
  const passed = failCount === 0

  return { passed, score, checklist }
}

export function applyHKDefaults(
  template: LabelTemplate,
  data: Partial<HKComplianceData> = {}
): LabelTemplate {
  const cloned = JSON.parse(JSON.stringify(template)) as LabelTemplate
  const { widthMm, heightMm, safeMm = 3 } = cloned.size

  // If template is empty or minimal, add standard HK elements
  if (cloned.elements.length < 3) {
    const defaultElements: TextElement[] = []

    // Product name (centered, top)
    defaultElements.push({
      kind: 'text',
      id: nanoid(8),
      x: widthMm / 2,
      y: safeMm + 8,
      text: data.productName || '{{productName}}',
      font: { family: 'Noto Sans TC', sizePt: 14, weight: 700, align: 'center' },
      color: '#1F2937'
    })

    // Net content
    if (data.netContent) {
      defaultElements.push({
        kind: 'text',
        id: nanoid(8),
        x: safeMm,
        y: heightMm - safeMm - 15,
        text: `淨含量：${data.netContent}`,
        font: { family: 'Noto Sans TC', sizePt: 8, weight: 400, align: 'left' },
        color: '#4B5563'
      })
    }

    // Usage
    if (data.usage) {
      defaultElements.push({
        kind: 'text',
        id: nanoid(8),
        x: safeMm,
        y: heightMm / 2,
        text: `用法：${data.usage}`,
        font: { family: 'Noto Sans TC', sizePt: 7, weight: 400, align: 'left' },
        color: '#374151'
      })
    } else {
      defaultElements.push({
        kind: 'text',
        id: nanoid(8),
        x: safeMm,
        y: heightMm / 2,
        text: '建議用法：每日2粒，飯後溫水送服',
        font: { family: 'Noto Sans TC', sizePt: 7, weight: 400, align: 'left' },
        color: '#374151'
      })
    }

    // Caution
    if (data.caution) {
      defaultElements.push({
        kind: 'text',
        id: nanoid(8),
        x: safeMm,
        y: heightMm / 2 + 8,
        text: `注意：${data.caution}`,
        font: { family: 'Noto Sans TC', sizePt: 6.5, weight: 400, align: 'left' },
        color: '#DC2626'
      })
    } else {
      defaultElements.push({
        kind: 'text',
        id: nanoid(8),
        x: safeMm,
        y: heightMm / 2 + 8,
        text: '注意：此產品並非藥物，不能替代藥物治療',
        font: { family: 'Noto Sans TC', sizePt: 6.5, weight: 400, align: 'left' },
        color: '#DC2626'
      })
    }

    // Storage
    if (data.storage) {
      defaultElements.push({
        kind: 'text',
        id: nanoid(8),
        x: safeMm,
        y: heightMm / 2 + 14,
        text: `存放：${data.storage}`,
        font: { family: 'Noto Sans TC', sizePt: 6, weight: 400, align: 'left' },
        color: '#6B7280'
      })
    } else {
      defaultElements.push({
        kind: 'text',
        id: nanoid(8),
        x: safeMm,
        y: heightMm / 2 + 14,
        text: '存放：請存放於陰涼乾燥處，避免陽光直射',
        font: { family: 'Noto Sans TC', sizePt: 6, weight: 400, align: 'left' },
        color: '#6B7280'
      })
    }

    // Made in HK
    defaultElements.push({
      kind: 'text',
      id: nanoid(8),
      x: safeMm,
      y: heightMm - safeMm - 8,
      text: data.madeInHK !== false ? '香港製造 Made in Hong Kong' : '香港製造',
      font: { family: 'Noto Sans TC', sizePt: 7, weight: 600, align: 'left' },
      color: '#059669'
    })

    // Manufacturer
    if (data.manufacturer) {
      defaultElements.push({
        kind: 'text',
        id: nanoid(8),
        x: safeMm,
        y: heightMm - safeMm - 3,
        text: data.manufacturer,
        font: { family: 'Noto Sans TC', sizePt: 5.5, weight: 400, align: 'left' },
        color: '#6B7280'
      })
    }

    cloned.elements = [...defaultElements, ...cloned.elements]
  }

  return cloned
}

export function getHKComplianceGuide(): string {
  return `
香港保健品標籤合規要求：

必須包含：
1. 產品名稱（中文或中英文）
2. 淨含量（如 60粒、500mg）
3. 使用方法（建議用量及服用方式）
4. 注意事項或警示語（如孕婦、兒童、過敏原等）
5. 製造商或進口商名稱及地址
6. 製造地標示（香港製造）
7. 非藥物聲明（此產品並非藥物，不能替代藥物治療）

建議包含：
8. 存放方式（存放於陰涼乾燥處等）
9. 批次號及有效期
10. 聯絡方式（電話、網站等）
11. 主要成分列表

注意事項：
- 繁體中文為主要語言
- 字體大小需清晰可讀
- 警示語應突出顯示（如紅色）
- 如涉及功效聲稱，需符合《不良醫藥廣告條例》
`.trim()
}

