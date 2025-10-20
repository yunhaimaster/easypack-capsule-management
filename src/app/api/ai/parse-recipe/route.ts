import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createSSEEncoder, sendSSEEvent, parseStreamBuffer, createStreamResponse } from '@/lib/ai/streaming-utils'
import { getOpenRouterHeaders, buildBaseRequest, fetchOpenRouter, getStandardModelCatalog } from '@/lib/ai/openrouter-utils'
import { validateApiKey } from '@/lib/api/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { text, image } = await request.json()

    if (!text && !image) {
      return NextResponse.json(
        { error: '請提供要解析的文字或圖片' },
        { status: 400 }
      )
    }

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.OPENROUTER_API_KEY)
    if (!apiKeyValidation.valid) {
      logger.error('OpenRouter API 密鑰未配置')
      return NextResponse.json(
        { error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    // 構建解析提示詞
    const systemPrompt = image 
      ? `你是一個專業的膠囊配方圖片識別助手。請嚴格按照以下步驟分析上傳的配方圖片：

**Step 1. 完整 OCR 識別**
逐行逐欄識別圖片中的所有文字內容，不要省略任何文字。特別注意：
- 表格中的每一行每一列
- 標題行（成分/含量/單位等）
- 手寫或印刷文字
- 數字和單位的組合

**Step 2. 表格結構化**
將識別的文字整理為表格格式，欄位包含：
- 原料名稱
- 含量數值
- 單位
- 原始文字

**Step 3. 結構化輸出**
將整理後資料轉換為標準 JSON 格式：

{
  "ingredients": [
    {
      "materialName": "原料名稱",
      "unitContentMg": 123.0,
      "originalText": "原始文字",
      "needsConfirmation": false,
      "isCustomerProvided": true
    }
  ],
  "summary": "解析摘要",
  "confidence": "高/中/低"
}

**Step 4. 摘要報告**
最後提供人類可讀的摘要：
- 共識別出多少種原料？
- 哪些項目需要人工確認？
- 識別難度評估

**處理規則：**
- 所有含量統一轉換為 mg（1g=1000mg, 1kg=1000000mg, 1IU維生素D3≈0.000025mg）
- 如果沒有指定單位，默認為 mg
- 如果無法確定數字或單位，將 unitContentMg 設為 0，needsConfirmation 設為 true
- 忽略非原料內容（如膠囊殼、包裝材料、包裝信息等）
- 特別針對配方表格：優先逐欄逐列讀取，不要將不同欄位合併
- 若有標題列（成分/含量/單位），請以此作為抽取依據
- 若單位與數字分開，請自動組合

**信心度規則：**
- 含量與單位清晰 → needsConfirmation: false
- 含量或單位缺失但能推測 → needsConfirmation: true
- 原字模糊、難以解讀 → needsConfirmation: true

請確保輸出完整的 JSON 格式，不要混入自由文本。`
      : `你是一個專業的膠囊配方文字解析助手。請嚴格依照以下步驟解析：

**Step 1. 原樣列出完整輸入文字**
逐行分段列出用戶輸入的完整文字，不得省略任何內容。

**Step 2. 提取原料名稱和含量+單位**
從文字中識別所有原料名稱（中文或英文）及其含量和單位。

**Step 3. 單位換算與轉換**
將所有含量統一轉換為 mg，使用以下換算規則：
- 無單位時，默認為 mg（例如：25 = 25mg）
- 1g = 1000mg
- 1kg = 1000000mg  
- 1mcg = 0.001mg
- IU 換算：維生素D3≈0.000025mg, 維生素E≈0.67mg, 維生素A≈0.0003mg
- 若遇到其他 IU 類型，標記 needsConfirmation=true 並保留原始數值

**Step 4. 結構化輸出**
嚴格按照以下 JSON schema 輸出：

{
  "ingredients": [
    {
      "materialName": "string",
      "unitContentMg": "number|null",
      "originalText": "string",
      "needsConfirmation": "boolean",
      "isCustomerProvided": true
    }
  ],
  "summary": "string",
  "confidence": "高|中|低"
}

**Step 5. 異常檢測與驗證**
- 當 unitContentMg > 2000mg 或 < 0.001mg 時，自動設 needsConfirmation=true
- 如果原料重複出現，請合併並在 originalText 保留多個來源
- 忽略非原料內容（膠囊殼、包裝材料等）
- 僅輸出原料成分

**Step 6. 智能摘要**
在 summary 中提供：
- 總共解析出多少種原料
- 哪些需要人工確認（列舉具體原料名稱）
- 單粒成分總重量（mg，加總所有 ingredients）
- 解析整體信心度評估

**語言要求：**
使用香港書面語繁體中文，保持專業但親切的語調，避免簡體中文或粵語口語。

**輸出規則：**
- unitContentMg 必須為數字（mg）或 null
- 確保所有數值都在合理範圍內
- 如果無法確定，設置 needsConfirmation 為 true
- 只返回原料，不包括輔料`

    const userPrompt = image 
      ? `請仔細分析這張配方圖片，識別其中的所有原料和含量信息。圖片可能包含：
- 產品標籤或說明書
- 手寫配方單據
- 印刷配方文件
- 配方表格或列表

請提取圖片中的所有原料信息，包括原料名稱和含量。`
      : `請解析以下配方文字：\n\n${text}`

    // 根據輸入類型選擇不同的模型
    const model = image ? 'qwen/qwen3-vl-235b-a22b-instruct' : 'deepseek/deepseek-chat-v3.1'
    
    const payload = buildBaseRequest(
      model,
      image 
        ? [
            { role: 'system', content: systemPrompt },
            { 
              role: 'user', 
              content: [
                { type: 'text', text: userPrompt },
                { type: 'image_url', image_url: { url: image } }
              ]
            }
          ]
        : [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
      {
        max_tokens: 32000,       // 設置到極限，確保複雜配方完整解析
        temperature: 0.05,       // 極低溫度，確保解析精確度
        top_p: 0.95,            // 提高 top_p
        frequency_penalty: 0.0,  // 移除懲罰，保持解析一致性
        presence_penalty: 0.0,   // 移除懲罰
        stream: false
      }
    )

    const response = await fetchOpenRouter(
      payload,
      process.env.OPENROUTER_API_KEY!,
      process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
    )


    const data = await response.json()
    logger.debug('配方解析 API 回應', {
      hasChoices: Boolean(data?.choices),
      rawSize: JSON.stringify(data).length
    })
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      logger.error('API 回應結構無效', { data })
      throw new Error('API 回應結構無效')
    }
    
    let aiResponse = data.choices[0].message.content
    
    if (!aiResponse || aiResponse.trim() === '') {
      logger.error('AI 回應為空')
      throw new Error('AI 回應為空')
    }

    // 清理 AI 回答中的異常文字
    aiResponse = aiResponse
      .replace(/<\|begin_of_sentence\s*\|>/g, '')
      .replace(/<\|end_of_sentence\s*\|>/g, '')
      .replace(/\|>/g, '')
      .trim()

    // 嘗試解析 JSON 回應
    let parsedData
    try {
      // 提取 JSON 部分
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonString = jsonMatch[0]
        parsedData = JSON.parse(jsonString)
      } else {
        throw new Error('無法找到有效的 JSON 格式')
      }
    } catch (parseError) {
      logger.error('JSON 解析錯誤', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        responseLength: aiResponse.length
      })
      
      // 如果 JSON 解析失敗，嘗試手動構建基本結構
      const lines = aiResponse.split('\n').filter((line: string) => line.trim())
      const ingredients = []
      
      for (const line of lines) {
        if (line.includes('mg') || line.includes('g') || line.includes('kg')) {
          // 嘗試提取原料信息
          const match = line.match(/(.+?)\s*(\d+(?:\.\d+)?)\s*(mg|g|kg)/i)
          if (match) {
            const materialName = match[1].trim()
            let unitContentMg = parseFloat(match[2])
            const unit = match[3].toLowerCase()
            
            // 轉換單位
            if (unit === 'g') unitContentMg *= 1000
            if (unit === 'kg') unitContentMg *= 1000000
            
            ingredients.push({
              materialName,
              unitContentMg,
              originalText: line.trim(),
              needsConfirmation: false,
              isCustomerProvided: true
            })
          }
        }
      }
      
      parsedData = {
        ingredients,
        summary: '手動解析結果，請確認準確性',
        confidence: '低'
      }
    }

    // 驗證和清理數據
    if (parsedData.ingredients && Array.isArray(parsedData.ingredients)) {
      parsedData.ingredients = parsedData.ingredients
        .filter((item: any) => item && typeof item === 'object')
        .map((item: any) => ({
          materialName: item.materialName || '未知原料',
          unitContentMg: typeof item.unitContentMg === 'number' ? item.unitContentMg : 0,
          originalText: item.originalText || '',
          needsConfirmation: Boolean(item.needsConfirmation),
          isCustomerProvided: item.isCustomerProvided !== undefined ? Boolean(item.isCustomerProvided) : true
        }))
        .filter((item: any) => item.materialName !== '未知原料' || item.unitContentMg > 0)
    } else {
      parsedData.ingredients = []
    }

    return NextResponse.json({
      success: true,
      data: parsedData
    })

  } catch (error) {
    logger.error('配方解析錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: '配方解析失敗，請檢查輸入格式或稍後再試' },
      { status: 500 }
    )
  }
}