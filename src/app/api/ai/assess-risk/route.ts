import { NextRequest, NextResponse } from 'next/server'
import { buildBaseRequest, fetchOpenRouter } from '@/lib/ai/openrouter-utils'
import { validateApiKey } from '@/lib/api/validation'

export async function POST(request: NextRequest) {
  try {
    const { materials } = await request.json()

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.OPENROUTER_API_KEY)
    if (!apiKeyValidation.valid) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // 構建系統提示詞 - 以膠囊灌裝專家身份
    const systemPrompt = `你是一位專業的膠囊灌裝技術專家，擁有20年的膠囊生產經驗。你的任務是評估各種原料在膠囊灌裝過程中的風險等級。

重要：請區分主原料和輔料，並以不同角度進行分析：

## 主原料評估標準：
1. 功效性風險 - 原料的藥理作用和安全性
2. 劑量風險 - 用量控制和精確度要求
3. 相互作用風險 - 與其他原料的相互作用
4. 穩定性風險 - 在膠囊中的穩定性
5. 法規風險 - 保健品法規合規性
6. 健康風險 - 對消費者的潛在影響
7. 流動性 - 灌裝過程中的流動特性
8. 混合性 - 與其他原料的混合難度

## 輔料評估標準：
1. 流動性 (Flowability) - 是否容易流動和填充
2. 黏性 (Viscosity) - 黏稠程度對灌裝的影響
3. 密度 (Density) - 密度對重量分佈的影響
4. 穩定性 (Stability) - 在灌裝過程中的穩定性
5. 混合性 (Mixability) - 與主原料的混合難度
6. 分離風險 (Segregation Risk) - 是否容易分層或分離
7. 結塊風險 (Caking Risk) - 是否容易結塊
8. 腐蝕性 (Corrosiveness) - 對設備的影響
9. 健康風險 (Health Risk) - 對操作人員的影響
10. 法規風險 (Regulatory Risk) - 法規合規性

## 輔料識別：
常見輔料包括：硬脂酸鎂、二氧化硅、麥芽糊精、微晶纖維素、羥丙基甲基纖維素、滑石粉、澱粉、乳糖、甘露醇、山梨醇、聚乙二醇、明膠、阿拉伯膠等。

請對每個原料進行專業評估，並提供：
- 原料類型 (主原料/輔料)
- 風險指數 (1-10分，10分最高風險)
- 風險等級 (低風險/中風險/高風險)
- 具體風險原因 (基於專業知識)
- 建議處理方法

語言要求：請使用香港書面語繁體中文，包括：
- 使用繁體中文字符
- 使用香港常用的專業術語
- 保持專業但親切的書面語語調
- 避免簡體中文、台灣用詞或粵語口語
- 使用正式的書面表達方式

請以JSON格式回應，格式如下：
{
  "assessments": [
    {
      "materialName": "原料名稱",
      "materialType": "主原料/輔料",
      "riskScore": 1-10,
      "riskLevel": "低風險/中風險/高風險",
      "riskReasons": ["原因1", "原因2", "原因3"],
      "recommendations": ["建議1", "建議2", "建議3"],
      "technicalNotes": "技術說明"
    }
  ]
}`

    // 構建用戶提示詞
    const userPrompt = `請評估以下原料的膠囊灌裝風險：

${materials.map((material: string) => `- ${material}`).join('\n')}

請基於你的專業經驗，從膠囊灌裝技術角度進行評估。
語言要求：請使用香港書面語繁體中文，使用繁體中文字符和香港常用的專業術語，避免粵語口語。`

    const payload = buildBaseRequest(
      'deepseek/deepseek-chat-v3.1',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        max_tokens: 8000,
        temperature: 0.1,
        top_p: 0.95,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        stream: false
      }
    )

    const response = await fetchOpenRouter(
      payload,
      process.env.OPENROUTER_API_KEY!,
      process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
    )


    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'AI 回應格式錯誤' }, { status: 500 })
    }

    try {
      // 嘗試解析 JSON 回應
      const assessments = JSON.parse(content)
      return NextResponse.json(assessments)
    } catch (parseError) {
      // 如果 JSON 解析失敗，返回原始內容
      return NextResponse.json({
        error: 'AI 回應格式不正確',
        rawResponse: content
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in AI risk assessment:', error)
    return NextResponse.json(
      { error: '風險評估處理失敗' },
      { status: 500 }
    )
  }
}
