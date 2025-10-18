export const IMAGE_TYPE_LABELS: Record<string, string> = {
  bottle: '實拍瓶身',
  lifestyle: '生活情境',
  flatlay: '平鋪俯拍',
  hongkong: '香港製造'
}

const DEFAULT_LABEL = '產品包裝'

const IMAGE_TYPE_DESCRIPTIONS: Record<string, string> = {
  bottle: '聚焦瓶身正面，採用時尚高端的視覺語言，搭配液態玻璃背景與漸層光暈。標籤需具備金屬燙金、浮雕紋理，本體為磨砂玻璃與金屬質感瓶蓋。',
  lifestyle: '將真實膠囊瓶（標準圓柱形保健品瓶身，高10-15cm）融入生活場景，瓶身置於前景清晰可見，標籤展示品牌與產品名稱。場景可包含手部互動或環境道具（如晨光廚房、健身房、書房），但產品必須為視覺主角，背景適度模糊突出瓶身質感。',
  flatlay: '俯視構圖，精準排列膠囊、量匙、草本原料、品牌印章與金屬徽章，背景使用大理石或麂皮材質並以品牌色幾何塊狀平衡畫面。',
  hongkong: '展示香港製造特色，融合維多利亞港、天際線、霓虹招牌或傳統茶樓等香港文化元素，突出產品的本地信任感與國際品質。'
}

const DEFAULT_DESCRIPTION = '聚焦產品包裝與標籤設計，背景保持乾淨，體現高端保健品牌質感。'

export function getImageTypeLabel(type: string): string {
  return IMAGE_TYPE_LABELS[type] ?? DEFAULT_LABEL
}

export function buildChineseImagePrompt(basePrompt: string, type: string, productName?: string): string {
  const trimmed = basePrompt.trim()
  const label = getImageTypeLabel(type)
  const composition = IMAGE_TYPE_DESCRIPTIONS[type] ?? DEFAULT_DESCRIPTION
  
  // Use actual product name or fallback
  const actualProductName = productName || 'Premium Wellness Formula'

  return [
    `請以高端保健品品牌的視覺語言，創作 ${label} 的產品包裝設計圖像。`,
    `構圖重點：${composition}`,
    '設計目標：打造創新又具市場質感的視覺，在社群與電商頁面中能立即吸引注意。',
    '設計要求：',
    `- **品牌與產品命名（必須）**：瓶身標籤清晰顯示品牌名稱「Easy Health」（頂部，小字體）與產品名稱「${actualProductName}」（居中，主標題大字體）。`,
    '- 標籤排版：品牌名稱使用較細的字體置於頂部，產品名稱為視覺焦點居中顯示，下方可加副標題或功效描述。',
    '- **所有文字必須使用英文**，避免中文標示，確保字距與可讀性，字體風格需與產品定位一致。',
    '- 標籤需包含香港法規要求的警示語：「THIS PRODUCT IS NOT A MEDICINE」（小字體於底部）。',
    '- 質感需呈現液態玻璃、金屬燙金或浮雕細節，搭配光影層次凸顯專業與奢華感。',
    '- 可在標籤加入幾何圖案、斜切線條或漸層色塊，呼應品牌個性。',
    '- 光線需有柔和主光與補光，保留細緻反射與陰影，可透過景深突出瓶身。',
    '- 若場景允許，加入符合功效的道具或食材元素，但不得喧賓奪主。',
    '攝影風格：8K 高解析度、商業攝影棚光源、細節銳利，支援高端品牌視覺。',
    `參考描述：${trimmed}`
  ].join('\n')
}

