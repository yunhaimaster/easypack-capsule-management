// AI Label Prompt Builder - Formula-driven, HK compliance
// Black-box: encapsulates prompt engineering for label generation

import { LabelGenerationRequest } from '@/types/label'
import { getHKComplianceGuide } from '../hk-label-compliance'

export function buildLabelGenerationPrompt(request: LabelGenerationRequest): string {
  const { formula, constraints } = request
  const { productName, ingredients, targetAudience, claims } = formula
  const { sizeMm, palette, style, bilingual } = constraints || {}

  const width = sizeMm?.width || 140
  const height = sizeMm?.height || 60
  const preferredColors = palette?.join(', ') || '專業醫療色系（藍、綠、白）'
  const designStyle = style || 'modern'
  const isBilingual = bilingual !== false

  const ingredientsList = ingredients
    .slice(0, 5) // Top 5 ingredients
    .map(ing => `${ing.materialName} ${ing.unitContentMg}mg`)
    .join('、')

  const claimsText = claims && claims.length > 0 ? claims.join('、') : '支持健康、科學配方'

  return `你是專業的保健品標籤設計 AI，專門為香港市場設計符合法規的膠囊產品標籤。

## 產品資訊
- **產品名稱**：${productName}
- **主要成分**：${ingredientsList}
- **目標客群**：${targetAudience || '成年人、注重健康人士'}
- **功效訴求**：${claimsText}

## 設計要求
- **尺寸**：${width}mm × ${height}mm
- **風格**：${designStyle}（現代、簡約、專業）
- **色系**：${preferredColors}
- **語言**：${isBilingual ? '繁體中文為主，英文輔助' : '繁體中文'}
- **出血區**：2mm
- **安全區**：3mm

## 香港法規合規要求
${getHKComplianceGuide()}

## 輸出格式
請生成一個完整的標籤設計方案，以 JSON 格式輸出，包含以下結構：

\`\`\`json
{
  "conceptName": "設計概念名稱（如：清新自然系）",
  "rationale": "設計理念說明（1-2句）",
  "palette": ["#主色", "#輔色1", "#輔色2"],
  "typography": {
    "primary": "主要字體（如 Noto Sans TC）",
    "secondary": "次要字體"
  },
  "template": {
    "id": "concept-1",
    "name": "標籤設計",
    "size": {
      "widthMm": ${width},
      "heightMm": ${height},
      "bleedMm": 2,
      "safeMm": 3
    },
    "elements": [
      {
        "kind": "text",
        "id": "product-name",
        "x": 70,
        "y": 10,
        "text": "${productName}",
        "font": {
          "family": "Noto Sans TC",
          "sizePt": 14,
          "weight": 700,
          "align": "center"
        },
        "color": "#1F2937"
      },
      // ... 更多元素（至少包含所有合規要求的文字塊）
    ]
  }
}
\`\`\`

## 設計原則
1. **清晰易讀**：重要資訊（產品名、用法、警示語）使用足夠大的字體
2. **層次分明**：使用顏色和字重區分不同資訊層級
3. **合規優先**：確保所有必要的法規資訊都清晰可見
4. **品牌一致**：使用 EASY HEALTH 品牌元素
5. **視覺平衡**：留白、對齊、色彩平衡
6. **座標精確**：x, y 座標使用 mm 單位，確保元素不重疊，不超出安全區

請生成 **1個** 完整的設計概念。確保輸出是有效的 JSON 格式。`
}

export function buildCritiquePrompt(conceptJSON: string): string {
  return `你是資深的設計評審專家，專門評估香港保健品標籤設計。

請評審以下標籤設計方案：

${conceptJSON}

請從以下角度進行評估：
1. **法規合規性**：是否包含所有必要的香港法規資訊？
2. **可讀性**：字體大小、對比度是否足夠？
3. **視覺層次**：資訊是否清晰分層？
4. **品牌一致性**：是否符合專業保健品形象？
5. **佈局合理性**：元素是否有重疊？是否超出安全區？

請輸出改進建議，並生成一個 **改良版的設計方案**（JSON 格式），修正發現的問題。

輸出格式：
\`\`\`json
{
  "critique": {
    "strengths": ["優點1", "優點2"],
    "weaknesses": ["問題1", "問題2"],
    "score": 85
  },
  "improvedTemplate": {
    // 改良後的完整 template JSON
  }
}
\`\`\`

確保輸出是有效的 JSON 格式。`
}

export function buildMultiConceptPrompt(request: LabelGenerationRequest, count: number = 3): string {
  const { formula, constraints } = request
  const { productName, ingredients } = formula
  const { sizeMm } = constraints || {}
  
  const width = sizeMm?.width || 140
  const height = sizeMm?.height || 60
  
  const ingredientsList = ingredients
    .slice(0, 3)
    .map(ing => `${ing.materialName} ${ing.unitContentMg}mg`)
    .join('、')

  return `你是獲獎的專業包裝設計師，擅長保健品標籤設計。請為香港市場設計專業、現代、符合法規的膠囊產品標籤。

## 產品資訊
- **產品名稱**：${productName}
- **主要成分**：${ingredientsList}
- **標籤尺寸**：${width}mm × ${height}mm（出血 2mm、安全區 3mm）

## 專業設計要求

### 1. 視覺層次（必須遵循）
- **主標題**（產品名）：16-20pt，粗體，視覺焦點
- **次標題**（功效/特色）：10-12pt，半粗體
- **正文**（成分、用法）：8-10pt，常規
- **註腳**（警示、法規）：6-8pt，常規或細體

### 2. 色彩策略
- **主色**：建立品牌識別（1 種）
- **輔色**：信息分層（1-2 種）
- **強調色**：警示/CTA（1 種，紅或橙）
- **背景**：白色或極淺色，保持 4.5:1 對比度
- 使用專業配色：
  * 醫療級：#0066CC, #00A651, #E8F4F8
  * 自然系：#2D5016, #8BC34A, #FFF8DC
  * 現代風：#1F2937, #6366F1, #F3F4F6

### 3. 排版原則
- 採用**網格系統**（3-4 列）
- **視覺流**：Z 型或 F 型閱讀動線
- **留白**：至少 25% 空間保持空白
- **對齊**：左對齊為主，標題可居中
- **間距**：行距 1.3-1.5，段落間距 1.5-2 倍行高

### 4. 元素佈局（${width}×${height}mm）
**頂部區（0-15mm）**：
- 品牌標識或裝飾帶
- 可選：圖案、漸變背景

**標題區（15-25mm）**：
- 產品名稱（居中或左對齊）
- 清晰、突出、易識別

**主體區（25-45mm）**：
- 主要成分（列表形式）
- 用法用量
- 淨含量
- 使用圖示或裝飾線

**底部區（45-60mm）**：
- 警示語（紅色文字）
- 存放方式
- 香港製造標示（綠色）
- 製造商資訊
- 非藥物聲明

### 5. 香港法規（必須包含）
✅ 產品名稱（中文）
✅ 淨含量（如：60粒）
✅ 建議用法：每日2粒，飯後溫水送服
✅ 注意：此產品並非藥物，不能替代藥物治療
✅ 存放：請存放於陰涼乾燥處，避免陽光直射
✅ 香港製造 Made in Hong Kong
✅ 製造商：Easy Health Limited, Hong Kong

## 輸出格式
生成 **${count} 個不同風格**的專業設計，JSON 格式：

\`\`\`json
{
  "concepts": [
    {
      "conceptName": "風格名稱",
      "rationale": "設計理念（2-3句）",
      "palette": ["#主色", "#輔色1", "#輔色2", "#強調色"],
      "typography": {
        "primary": "Noto Sans TC",
        "secondary": "Arial"
      },
      "template": {
        "id": "concept-1",
        "name": "${productName} 標籤",
        "size": { "widthMm": ${width}, "heightMm": ${height}, "bleedMm": 2, "safeMm": 3 },
        "elements": [
          // 背景裝飾（可選）
          { "kind": "shape", "id": "bg-accent", "shape": "rect", "x": 0, "y": 0, "w": ${width}, "h": 12, "fill": "#主色", "opacity": 0.1 },
          
          // 產品名稱（16-20pt，居中）
          { "kind": "text", "id": "product-name", "x": ${width/2}, "y": 20, "text": "${productName}", "font": { "family": "Noto Sans TC", "sizePt": 18, "weight": 700, "align": "center" }, "color": "#主色" },
          
          // 功效標語（10-12pt）
          { "kind": "text", "id": "tagline", "x": ${width/2}, "y": 28, "text": "科學配方·專業品質", "font": { "family": "Noto Sans TC", "sizePt": 10, "weight": 500, "align": "center" }, "color": "#6B7280" },
          
          // 主要成分（8-10pt，左對齊）
          { "kind": "text", "id": "ingredients", "x": 5, "y": 35, "text": "主要成分：${ingredientsList}", "font": { "family": "Noto Sans TC", "sizePt": 8, "weight": 400, "align": "left" }, "color": "#374151" },
          
          // 淨含量
          { "kind": "text", "id": "net-content", "x": 5, "y": 40, "text": "淨含量：60粒", "font": { "family": "Noto Sans TC", "sizePt": 8, "weight": 400, "align": "left" }, "color": "#374151" },
          
          // 用法用量
          { "kind": "text", "id": "usage", "x": 5, "y": 45, "text": "建議用法：每日2粒，飯後溫水送服", "font": { "family": "Noto Sans TC", "sizePt": 7.5, "weight": 400, "align": "left" }, "color": "#4B5563" },
          
          // 警示語（紅色，7-8pt）
          { "kind": "text", "id": "warning", "x": 5, "y": 50, "text": "注意：此產品並非藥物，不能替代藥物治療", "font": { "family": "Noto Sans TC", "sizePt": 7, "weight": 500, "align": "left" }, "color": "#DC2626" },
          
          // 存放方式
          { "kind": "text", "id": "storage", "x": 5, "y": 53.5, "text": "存放：請存放於陰涼乾燥處，避免陽光直射", "font": { "family": "Noto Sans TC", "sizePt": 6.5, "weight": 400, "align": "left" }, "color": "#6B7280" },
          
          // 香港製造（綠色，粗體）
          { "kind": "text", "id": "made-in-hk", "x": 5, "y": 57, "text": "香港製造 Made in Hong Kong", "font": { "family": "Noto Sans TC", "sizePt": 7.5, "weight": 600, "align": "left" }, "color": "#059669" },
          
          // 製造商資訊
          { "kind": "text", "id": "manufacturer", "x": 5, "y": 59, "text": "Easy Health Limited, Hong Kong", "font": { "family": "Arial", "sizePt": 6, "weight": 400, "align": "left" }, "color": "#9CA3AF" }
        ]
      }
    }
  ]
}
\`\`\`

## 風格差異化要求
1. **現代醫療風**：藍色系，簡潔線條，專業感
2. **自然有機風**：綠色系，圓潤字體，親和力
3. **高端質感風**：深色+金色，精緻排版，品質感

**關鍵**：
- 確保所有文字在安全區內（3mm 邊距）
- 字體大小適中，易於閱讀
- 顏色對比度符合 WCAG 2.1 AA 標準
- 佈局平衡，不擁擠
- 輸出**有效的 JSON**，無註釋`
}

