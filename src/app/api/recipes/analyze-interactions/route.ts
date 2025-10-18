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
      .map((ing: any) => `${ing.materialName} (${ing.unitContentMg}mg)`)
      .join('\n')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://capsuledb.easyhealth.internal',
        'X-Title': 'Easy Health Interaction Analyzer'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `你是保健品配方專家。分析原料相互作用，只回報實際存在的重要相互作用。以JSON格式回應：
{
  "warnings": [
    {
      "ingredient1": "原料1",
      "ingredient2": "原料2",
      "severity": "high|medium|low",
      "warning": "相互作用說明",
      "recommendation": "處理建議"
    }
  ]
}

如果沒有重要相互作用，返回空數組。使用繁體中文。`
          },
          {
            role: 'user',
            content: `分析以下原料的相互作用：\n${ingredientList}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error('AI API 請求失敗')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    // Parse JSON response
    const result = JSON.parse(content)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Analyze interactions error:', error)
    return NextResponse.json({
      success: false,
      error: '分析失敗'
    }, { status: 500 })
  }
}

