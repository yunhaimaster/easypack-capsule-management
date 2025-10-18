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

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://capsuledb.easyhealth.internal',
        'X-Title': 'Easy Health Recipe Optimizer'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `你是保健品配方優化專家。提供配方改進建議，包括：
1. 成本優化建議
2. 功效提升建議
3. 原料替代方案
4. 製程改善建議

以JSON格式回應：
{
  "suggestions": [
    {
      "title": "建議標題",
      "description": "詳細說明",
      "impact": "預期效果",
      "priority": "high|medium|low"
    }
  ]
}

使用繁體中文。`
          },
          {
            role: 'user',
            content: `分析並優化以下配方：\n${ingredientList}\n\n提供3-5個實用的優化建議。`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error('AI API 請求失敗')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    const result = JSON.parse(content)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Suggest alternatives error:', error)
    return NextResponse.json({
      success: false,
      error: '分析失敗'
    }, { status: 500 })
  }
}

