import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { success: false, error: '缺少配方內容' },
        { status: 400 }
      )
    }

    const systemPrompt = `你是一個專業的保健品配方分析專家。請從以下配方內容中提取和優化產品信息：

配方內容：
${content}

請分析並提取以下信息：

1. **產品名稱**：生成一個專業、合適的產品名稱（避免不當內容）
2. **產品描述**：簡潔的產品描述（1-2句話）
3. **主要功效**：明確的主要功效描述
4. **目標受眾**：適合的目標受眾群體
5. **膠囊規格**：根據原料密度分析建議的膠囊大小
6. **堆積密度分析**：評估各原料的堆積密度和混合後的總密度
7. **功效評分**：基於原料科學證據的功效評分（1-10分）
8. **安全評分**：基於原料安全性的安全評分（1-10分）
9. **評分理由**：詳細說明評分依據

請以JSON格式返回結果：
{
  "name": "專業產品名稱",
  "description": "產品描述",
  "targetEffect": "主要功效",
  "targetAudience": "目標受眾",
  "capsuleSize": "建議膠囊大小",
  "densityAnalysis": "堆積密度分析",
  "capsuleRecommendation": "膠囊規格建議",
  "efficacyScore": 8.5,
  "safetyScore": 8.0,
  "efficacyReason": "功效評分理由",
  "safetyReason": "安全評分理由"
}

請確保：
- 產品名稱專業且合適
- 功效描述準確且專業
- 膠囊大小基於密度計算
- 避免任何不當內容`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: '請分析這個配方並提取產品信息'
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('AI 回應為空')
    }

    // 嘗試解析JSON回應
    let extractedInfo
    try {
      // 提取JSON部分
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedInfo = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('無法找到JSON格式的回應')
      }
    } catch (parseError) {
      console.warn('JSON解析失敗，使用原始回應:', parseError)
      extractedInfo = {
        name: 'AI生成配方',
        description: '專業保健品配方',
        targetEffect: '改善健康狀況',
        targetAudience: '一般成人',
        capsuleSize: '建議諮詢專業人員',
        densityAnalysis: aiResponse,
        capsuleRecommendation: '基於原料密度分析'
      }
    }

    return NextResponse.json({
      success: true,
      extractedInfo,
      generatedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('AI產品信息提取錯誤:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'AI產品信息提取失敗',
        details: error instanceof Error ? error.message : '未知錯誤'
      },
      { status: 500 }
    )
  }
}
