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
  chineseProductName?: string,
  labelPalette?: { main: string; accent?: string }
): string {
  // 策略：完全信任 DeepSeek 的 basePrompt
  // 只添加產品命名信息（DeepSeek 不知道具體產品名）
  
  const trimmed = basePrompt.trim()
  
  // 專用：將容易誘發化妝品聯想的詞彙，統一替換為膠囊/配方語義
  const sanitizeEnglishNameForCapsules = (name: string): string => {
    const replacements: Array<[RegExp, string]> = [
      [/\bSerum\b/gi, 'Capsules'],
      [/\bEssence\b/gi, 'Capsules'],
      [/\bElixir\b/gi, 'Capsules'],
      [/\bAmpoule\b/gi, 'Capsules'],
      [/\bTonic\b/gi, 'Formula']
    ]
    let result = name
    for (const [pattern, rep] of replacements) {
      result = result.replace(pattern, rep)
    }
    // 去除重複空白
    return result.replace(/\s{2,}/g, ' ').trim()
  }

  const sanitizeChineseNameForCapsules = (name: string): string => {
    // 將「精華/精華液/精華露」等改為「膠囊」；若語義不合可退而求其次用「配方」
    let result = name
    result = result.replace(/精華液|精華露|精華/g, '膠囊')
    // 若出現「膠囊膠囊」等重複，精簡為單一
    result = result.replace(/(膠囊){2,}/g, '膠囊')
    return result.trim()
  }

  // Extract Chinese product name from basePrompt if not provided
  let actualChineseName = chineseProductName
  if (!actualChineseName) {
    const chineseNameMatch = trimmed.match(/產品.*?名[稱為][:：]\s*([^\n]+)/)
    if (chineseNameMatch) {
      actualChineseName = chineseNameMatch[1].trim()
    }
  }
  
  // 淨化命名，避免引導為液體/精華類外觀
  const rawEnglish = productName || 'Premium Wellness Formula'
  const actualProductName = sanitizeEnglishNameForCapsules(rawEnglish)
  if (actualChineseName) {
    actualChineseName = sanitizeChineseNameForCapsules(actualChineseName)
  }

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
  
  // 膠囊瓶形態補強（與 DeepSeek 基礎指令一致，僅作強化，避免模型誤判為精華液/滴管）
  brandingSupplement.push('\n--- 產品形態補強（絕對必須遵守） ---')
  brandingSupplement.push('這是一款標準圓柱形保健品膠囊瓶（supplement bottle / vitamin bottle），瓶內裝有膠囊顆粒。標準旋蓋式瓶蓋，非滴管頭、非按壓頭、非噴嘴。')
  brandingSupplement.push('❌ 嚴禁：液體瓶、精華液瓶（serum bottle）、滴管瓶（dropper bottle）、化妝品瓶（cosmetic bottle）、安瓿瓶（ampoule）。')

  // 香港製造：背景使用城市配色，但瓶身標籤需與其他圖片保持一致
  if (type === 'hongkong' && labelPalette && labelPalette.main) {
    brandingSupplement.push('\n--- 標籤配色一致性（香港製造專用） ---')
    if (labelPalette.accent) {
      brandingSupplement.push(`瓶身標籤與瓶蓋配色必須與其他圖片保持一致：主色「${labelPalette.main}」，輔色「${labelPalette.accent}」。`)
    } else {
      brandingSupplement.push(`瓶身標籤與瓶蓋配色必須與其他圖片保持一致：主色「${labelPalette.main}」。`)
    }
    brandingSupplement.push('背景、場景與城市光影使用香港城市專屬配色，但標籤配色與圖形元素需延續產品的主色/輔色系統以維持一致性。')
  }
  
  // basePrompt 優先，品牌信息補充在後
  return trimmed + '\n' + brandingSupplement.join('\n')
}

