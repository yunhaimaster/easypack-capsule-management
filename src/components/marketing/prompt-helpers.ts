export const IMAGE_TYPE_LABELS: Record<string, string> = {
  bottle: '實拍瓶身',
  lifestyle: '生活情境',
  flatlay: '平鋪俯拍',
  hongkong: '香港製造',
  poster: '宣傳海報'
}

const DEFAULT_LABEL = '產品包裝'

const IMAGE_TYPE_DESCRIPTIONS: Record<string, string> = {
  bottle: '聚焦瓶身正面，採用現代高端視覺語言。標籤清晰展示中文產品名稱與「Easy Health」品牌，採用金屬燙金、浮雕紋理，瓶身為磨砂玻璃與金屬瓶蓋。背景使用合適的視覺風格配色，不強制要求中式元素。',
  lifestyle: '將真實膠囊瓶（標準圓柱形保健品瓶身，高10-15cm）融入適合的生活場景，瓶身置於前景清晰可見，標籤展示中文產品名與品牌。場景可包含養生道具、茶具或現代家居環境，產品為視覺主角，背景適度模糊突出瓶身質感。',
  flatlay: '俯視構圖，精準排列膠囊、量匙、相關原料、筆記卡，背景使用原木、竹材、大理石或白色檯面材質，可選擇現代極簡、自然有機、專業醫療、或時尚潮流等風格，不強制使用中式元素。',
  hongkong: '展示香港製造特色，融合維多利亞港、天際線、霓虹招牌或傳統茶樓等香港文化元素。瓶身標籤清晰顯示「香港製造 | Made in Hong Kong」雙語標示，突出產品的本地信任感與國際品質，呈現中西文化交融的現代香港形象。',
  poster: '垂直構圖宣傳海報（3:4比例），包含主標題區（產品中文名稱大字體）、視覺焦點（產品瓶身或情境）、功效說明區（3-5個賣點）、品牌資訊區（Easy Health Logo + 香港製造標誌）。高解析度設計，適合 A3 印刷。'
}

const DEFAULT_DESCRIPTION = '聚焦產品包裝與標籤設計，背景保持乾淨，體現高端保健品牌質感。'

export function getImageTypeLabel(type: string): string {
  return IMAGE_TYPE_LABELS[type] ?? DEFAULT_LABEL
}

export function buildChineseImagePrompt(
  basePrompt: string, 
  type: string, 
  productName?: string,
  chineseProductName?: string
): string {
  const trimmed = basePrompt.trim()
  const label = getImageTypeLabel(type)
  const composition = IMAGE_TYPE_DESCRIPTIONS[type] ?? DEFAULT_DESCRIPTION
  
  // Extract Chinese product name from basePrompt if not provided
  let actualChineseName = chineseProductName
  if (!actualChineseName) {
    // Try to extract from prompt using regex
    const chineseNameMatch = trimmed.match(/產品.*?名[稱為][:：]\s*([^\n]+)/)
    if (chineseNameMatch) {
      actualChineseName = chineseNameMatch[1].trim()
    }
  }
  
  // Use actual product name or fallback
  const actualProductName = productName || 'Premium Wellness Formula'

  // Build Chinese-optimized prompt
  const brandText = actualChineseName 
    ? `品牌名稱「Easy Health 依時健」與中文產品名稱「${actualChineseName}」`
    : `品牌名稱「Easy Health 依時健」與產品名稱「${actualProductName}」`

  return [
    `請以適合中國市場的高端保健品視覺語言，創作 ${label} 的產品包裝設計圖像。`,
    `構圖重點：${composition}`,
    '設計目標：打造融合現代設計與中式美學的包裝視覺，在社群與電商中能吸引華人消費者注意。',
    '設計要求：',
    `- **品牌與產品命名（必須）**：瓶身標籤清晰顯示${brandText}。`,
    actualChineseName 
      ? `- **中文產品名稱（主標題）**：「${actualChineseName}」以較大字體居中顯示，使用清晰易讀的中文字體（如思源黑體、蘋方、微軟正黑體風格），確保在包裝上清晰可辨。`
      : '- **產品名稱顯示**：以居中方式顯示產品名稱，使用清晰易讀的字體。',
    `- **英文產品名稱（副標題）**：「${actualProductName}」以較小字體置於中文名稱下方。`,
    '- **品牌名稱位置**：「Easy Health」（英文）置於頂部小字體區域。',
    type === 'hongkong' 
      ? '- **雙語產地標示**：「香港製造 | Made in Hong Kong」需清晰顯示，中文在前，字體清晰。'
      : '- 標籤底部可包含「香港製造」或「Made in Hong Kong」小字標示。',
    '- **設計風格選擇**：可選擇現代極簡、自然有機、專業醫療、時尚潮流等風格，或適度融入文化元素（如山水意境、幾何圖案），但保持現代專業感，不強制使用中式元素。',
    '- **中文字體清晰度**：確保所有中文文字（產品名、產地標示）字距適中、筆劃清晰、易於閱讀，避免字體過小或模糊。',
    '- 質感需呈現液態玻璃、金屬燙金或浮雕細節，搭配光影層次凸顯專業與奢華感。',
    '- 光線需有柔和主光與補光，保留細緻反射與陰影，可透過景深突出瓶身。',
    '- 若場景允許，可選擇性加入符合功效的道具（如養生元素、天然材料、現代配件等），但不得喧賓奪主。',
    '攝影風格：8K 高解析度、商業攝影棚光源、細節銳利，支援高端品牌視覺。',
    `參考描述：${trimmed}`
  ].join('\n')
}

