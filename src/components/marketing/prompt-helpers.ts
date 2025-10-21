export const IMAGE_TYPE_LABELS: Record<string, string> = {
  bottle: '實拍瓶身',
  lifestyle: '生活情境',
  flatlay: '平鋪俯拍',
  hongkong: '香港製造',
  poster: '宣傳海報'
}

const DEFAULT_LABEL = '產品包裝'

export function getImageTypeLabel(type: string): string {
  return IMAGE_TYPE_LABELS[type] ?? DEFAULT_LABEL
}

export function buildChineseImagePrompt(
  basePrompt: string, 
  type: string, 
  productName?: string,
  chineseProductName?: string
): string {
  // 策略：完全信任 DeepSeek 的 basePrompt
  // 只添加產品命名信息（DeepSeek 不知道具體產品名）
  
  const trimmed = basePrompt.trim()
  
  // Extract Chinese product name from basePrompt if not provided
  let actualChineseName = chineseProductName
  if (!actualChineseName) {
    const chineseNameMatch = trimmed.match(/產品.*?名[稱為][:：]\s*([^\n]+)/)
    if (chineseNameMatch) {
      actualChineseName = chineseNameMatch[1].trim()
    }
  }
  
  const actualProductName = productName || 'Premium Wellness Formula'

  // 只添加產品命名補充，不覆蓋或干擾 DeepSeek 的視覺指令
  const brandingSupplement = []
  
  brandingSupplement.push('\n--- 品牌標示補充 ---')
  if (actualChineseName) {
    brandingSupplement.push(`瓶身標籤必須清晰顯示：「Easy Health 依時健」品牌名（頂部小字）、「${actualChineseName}」產品中文名（中央大字）、「${actualProductName}」英文名（下方中字）。`)
  } else {
    brandingSupplement.push(`瓶身標籤必須清晰顯示：「Easy Health 依時健」品牌名、「${actualProductName}」產品名。`)
  }
  
  if (type === 'hongkong') {
    brandingSupplement.push(`標籤底部顯著位置：「香港製造 | Made in Hong Kong」（中文在前）。`)
  } else {
    brandingSupplement.push(`標籤底部：「Made in Hong Kong」或「香港製造」小字標示。`)
  }
  
  // basePrompt 優先，品牌信息補充在後
  return trimmed + '\n' + brandingSupplement.join('\n')
}

