import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { ingredients } = await request.json()
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'AI 服務暫時無法使用'
      }, { status: 500 })
    }

    const ingredientList = ingredients
      .map((ing: any) => `${ing.materialName}: ${ing.unitContentMg}mg`)
      .join('\n')

    // Create AbortController for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://capsuledb.easyhealth.internal',
        'X-Title': 'Easy Health Recipe Optimizer'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1',
        messages: [
          {
            role: 'system',
            content: `你是專業的保健品配方優化專家，擁有豐富的配方設計和成本控制經驗。

你的任務是分析保健品配方，提供實用的優化建議，包括：
1. 成本優化建議 - 在保持功效的前提下降低成本
2. 功效提升建議 - 通過原料調整提升保健功效
3. 原料替代方案 - 更優質或更經濟的原料選擇
4. 製程改善建議 - 提升生產效率和產品穩定性

重要規則：
- 建議必須基於科學證據和實際可行性
- 優先考慮成本效益比
- 確保符合香港保健品法規要求
- 建議要具體可執行，不要空泛

JSON 格式：
{
  "suggestions": [
    {
      "title": "建議標題（簡短明確）",
      "description": "詳細說明（包含具體數據或替代方案）",
      "impact": "預期效果（量化說明）",
      "priority": "high|medium|low"
    }
  ]
}

請使用繁體中文（香港）回應。`
          },
          {
            role: 'user',
            content: `請分析以下保健品配方並提供優化建議：

${ingredientList}

請提供 3-5 個實用的優化建議，每個建議都要具體可行，包含明確的改進方向和預期效果。`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('AI API 請求失敗')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      throw new Error('AI 回應為空')
    }

    const result = JSON.parse(content)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Suggest alternatives error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: '分析超時，請稍後再試'
      }, { status: 408 })
    }
    
    return NextResponse.json({
      success: false,
      error: '分析失敗，請重試'
    }, { status: 500 })
  }
}

