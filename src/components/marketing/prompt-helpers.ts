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

  // Build prompt with basePrompt as PRIMARY instructions
  const sections = []
  
  // SECTION 1: PRIMARY VISUAL INSTRUCTIONS (from AI analysis - HIGHEST PRIORITY)
  sections.push('========== 主要視覺指令（必須嚴格遵守）==========')
  sections.push(trimmed)
  sections.push('')
  
  // SECTION 2: PRODUCT FORM REQUIREMENT (CRITICAL - prevents wrong bottle type)
  sections.push('========== 產品形態要求（絕對必須遵守）==========')
  sections.push('⚠️ 產品必須是標準圓柱形膠囊保健品瓶：')
  sections.push('- 瓶身：標準圓柱形保健品瓶（supplement bottle），高度10-15cm，直徑5-7cm')
  sections.push('- 瓶蓋：標準旋蓋式瓶蓋（screw cap）')
  sections.push('- 內容物：膠囊顆粒（capsules/pills）清晰可見')
  sections.push('- 材質：不透明或半透明塑料/玻璃')
  sections.push('- 標籤：紙質標籤貼紙')
  sections.push('')
  sections.push('❌ 絕對禁止以下瓶型：')
  sections.push('- 滴管瓶（dropper bottle）')
  sections.push('- 精華液瓶（serum bottle）')
  sections.push('- 化妝品瓶（cosmetic bottle）')
  sections.push('- 噴霧瓶（spray bottle）')
  sections.push('- 按壓瓶（pump bottle）')
  sections.push('- 任何帶有滴管頭、按壓頭、噴嘴的瓶子')
  sections.push('')
  
  // SECTION 3: BRANDING REQUIREMENTS (product naming only)
  sections.push('========== 品牌標示要求 ==========')
  if (actualChineseName) {
    sections.push(`- 品牌名稱：「Easy Health 依時健」（小字於頂部）`)
    sections.push(`- 中文產品名（主標題）：「${actualChineseName}」（大字居中，清晰易讀）`)
    sections.push(`- 英文產品名（副標題）：「${actualProductName}」（中字於中文名下方）`)
  } else {
    sections.push(`- 品牌：「Easy Health 依時健」`)
    sections.push(`- 產品名：「${actualProductName}」`)
  }
  
  if (type === 'hongkong') {
    sections.push('- 產地標示（顯著位置）：「香港製造 | Made in Hong Kong」（中文在前，字體清晰）')
  } else {
    sections.push('- 產地標示（底部小字）：「Made in Hong Kong」或「香港製造」')
  }
  sections.push('')
  
  // SECTION 4: SPECIAL REQUIREMENTS FOR HONG KONG TYPE
  if (type === 'hongkong') {
    sections.push('========== 香港製造特殊要求（絕對必須遵守）==========')
    sections.push('⚠️ 這是戶外城市地標照片，不是室內生活照：')
    sections.push('✅ 必須包含：')
    sections.push('- 戶外城市場景（天台、碼頭、觀景台、街道）')
    sections.push('- 香港地標為主角（維港、IFC、中銀大廈等）佔畫面50-60%')
    sections.push('- 大型立體「Made in Hong Kong」金色文字佔15-20%')
    sections.push('- 產品為點綴（20-25%），不遮擋地標')
    sections.push('- 城市燈光、霓虹招牌、黃金時刻光線')
    sections.push('- 都市色調：金屬灰、霓虹藍、建築黃、海港藍')
    sections.push('')
    sections.push('❌ 絕對禁止：')
    sections.push('- 室內場景（家居、辦公室、店鋪內部）')
    sections.push('- 家具（床、沙發、茶几、書桌、椅子）')
    sections.push('- 室內材質（大理石檯面、木材桌面、布料背景）')
    sections.push('- 生活道具（茶杯、枕頭、書本、食材、植物、檸檬、綠葉）')
    sections.push('- 人物（手持、使用產品）')
    sections.push('- 室內光線（溫馨柔光、檯燈、暖色調）')
    sections.push('- 特寫構圖（淺景深、模糊背景）')
    sections.push('')
    sections.push('📸 拍攝風格：像香港旅遊局宣傳照、《國家地理》城市攝影、高端地產廣告')
    sections.push('')
  }
  
  // SECTION 5: TECHNICAL SPECS
  sections.push('========== 技術規格 ==========')
  sections.push('- 解析度：8K 超高清')
  sections.push('- 攝影：專業商業攝影棚光源')
  sections.push('- 質感：細節銳利、光影層次豐富')
  sections.push('- 品牌定位：高端保健品牌視覺')
  
  return sections.join('\n')
}

