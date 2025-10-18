import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface ParsedIngredient {
  materialName: string
  unitContentMg: number
}

interface ParsedRecipe {
  recipeName: string
  ingredients: ParsedIngredient[]
  confidence: '高' | '中' | '低'
  needsConfirmation: boolean
  description?: string
  capsuleSize?: string
  capsuleColor?: string
  capsuleType?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, image } = body

    if (!text && !image) {
      return NextResponse.json(
        { success: false, error: '請提供文字或圖片' },
        { status: 400 }
      )
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API Key 未配置' },
        { status: 500 }
      )
    }

    // 系統提示詞
    const systemPrompt = `你是專業的保健品配方解析助手。用戶會提供一段包含多個配方的文字或圖片，每個配方包含配方名稱和原料列表。

你的任務：
1. 識別每個配方的名稱
2. 提取每個配方的原料名稱和含量（單位：mg）
3. 如果含量單位不是 mg，請轉換（1g = 1000mg, 1IU 維生素D3 = 0.025mg, 1IU 維生素E = 0.67mg, 1IU 維生素A = 0.0003mg）
4. 可選：識別膠囊規格（如 #0, #00, #1 等）、膠囊顏色、膠囊類型
5. 返回 JSON 格式的結構化數據

輸入格式示例：
"""
配方1: 美白配方
維生素C 500mg
熊果苷 100mg
煙酰胺 50mg

配方2: 骨骼健康配方
鈣 200mg
維生素D3 1000IU
鎂 100mg
"""

返回格式（必須是有效的 JSON）：
{
  "recipes": [
    {
      "recipeName": "美白配方",
      "description": "改善膚色，提亮肌膚",
      "ingredients": [
        { "materialName": "維生素C", "unitContentMg": 500 },
        { "materialName": "熊果苷", "unitContentMg": 100 },
        { "materialName": "煙酰胺", "unitContentMg": 50 }
      ],
      "capsuleSize": "#0",
      "capsuleColor": "白色",
      "capsuleType": "植物胃溶",
      "confidence": "高",
      "needsConfirmation": false
    }
  ]
}

注意事項：
- 必須返回有效的 JSON 格式
- 配方名稱如果沒有明確標註，可以根據原料組合推測（如"維生素C配方"）
- 如果單位不明確或無法轉換，設置 needsConfirmation: true
- 信心度評估：高（所有信息清晰）、中（部分信息需確認）、低（大部分信息不確定）
- 只返回 JSON，不要包含任何其他文字說明`

    // 構建消息
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ]

    if (image) {
      // 圖片解析
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: '請解析這張圖片中的配方信息，返回 JSON 格式的結果。'
          },
          {
            type: 'image_url',
            image_url: {
              url: image
            }
          }
        ]
      })
    } else {
      // 文字解析
      messages.push({
        role: 'user',
        content: `請解析以下配方文字，返回 JSON 格式的結果：\n\n${text}`
      })
    }

    // 調用 OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Easy Health - Recipe Parser'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-mini', // 使用快速且準確的模型
        messages,
        temperature: 0.1, // 低溫度確保準確的模板解析
        top_p: 0.9,       // 優化準確性與效率平衡
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', errorText)
      return NextResponse.json(
        { success: false, error: `AI 解析失敗: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'AI 未返回有效內容' },
        { status: 500 }
      )
    }

    // 解析 JSON 回應
    let parsedResult: { recipes: ParsedRecipe[] }
    try {
      parsedResult = JSON.parse(content)
    } catch (error) {
      console.error('JSON parse error:', error)
      return NextResponse.json(
        { success: false, error: 'AI 返回的格式無效，請重試' },
        { status: 500 }
      )
    }

    // 驗證結果
    if (!parsedResult.recipes || !Array.isArray(parsedResult.recipes)) {
      return NextResponse.json(
        { success: false, error: '解析結果格式錯誤' },
        { status: 500 }
      )
    }

    // 過濾和驗證配方
    const validRecipes = parsedResult.recipes.filter(recipe => {
      return (
        recipe.recipeName &&
        recipe.ingredients &&
        Array.isArray(recipe.ingredients) &&
        recipe.ingredients.length > 0
      )
    })

    if (validRecipes.length === 0) {
      return NextResponse.json(
        { success: false, error: '未能解析到有效的配方數據' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        recipes: validRecipes,
        summary: `成功解析 ${validRecipes.length} 個配方`
      }
    })

  } catch (error) {
    console.error('Parse templates error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '解析失敗，請稍後再試'
      },
      { status: 500 }
    )
  }
}

