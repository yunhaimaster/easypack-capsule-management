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
        model: 'deepseek/deepseek-chat-v3.1',
        messages: [
          {
            role: 'system',
            content: `你是專業的保健品配方專家和藥物相互作用專家。分析以下保健品原料之間的相互作用，基於科學文獻和臨床證據。

重要規則：
1. 只回報實際存在且有科學依據的重要相互作用
2. 不要過度警告或虛構風險
3. 若沒有顯著的相互作用，返回空數組
4. 嚴格按照JSON格式回應

JSON格式：
{
  "warnings": [
    {
      "ingredient1": "原料1名稱",
      "ingredient2": "原料2名稱",
      "severity": "high|medium|low",
      "warning": "相互作用的具體說明（基於科學證據）",
      "recommendation": "專業的處理建議"
    }
  ]
}

風險等級標準：
- high: 可能導致嚴重健康問題或顯著降低療效
- medium: 可能影響療效或引起輕微不適
- low: 理論上可能存在但臨床意義不大

請使用繁體中文（香港）回應。`
          },
          {
            role: 'user',
            content: `請分析以下保健品原料的相互作用：

${ingredientList}

請基於科學文獻和臨床證據，識別任何重要的原料相互作用。如果沒有顯著的相互作用，請返回空數組。`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
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

