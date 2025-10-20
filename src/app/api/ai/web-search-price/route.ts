import { NextRequest, NextResponse } from 'next/server'
import { buildBaseRequest, fetchOpenRouter } from '@/lib/ai/openrouter-utils'
import { validateApiKey } from '@/lib/api/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { materialName, searchType = 'price' } = await request.json()

    if (!materialName) {
      return NextResponse.json(
        { success: false, error: '缺少原料名稱參數' },
        { status: 400 }
      )
    }

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.OPENROUTER_API_KEY)
    if (!apiKeyValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    // 構建搜索提示，讓 AI 搜索最新的價格信息
    const systemPrompt = `你是一個專業的原料價格搜索專家，專門為保健品公司搜索最新的原料價格信息。

搜索對象：${materialName}
搜索類型：${searchType}

請搜索並提供以下信息：
1. 最新的市場價格（多個供應商）
2. 價格趨勢分析
3. 供應商信息（名稱、聯繫方式、最小訂購量）
4. 質量等級和認證
5. 交貨期和物流信息
6. 市場預測和建議

請使用香港書面語繁體中文回答，確保信息準確、最新且實用。

注意：請提供具體的價格數據、供應商名稱和聯繫方式，以便用戶可以直接使用。`

    const payload = buildBaseRequest(
      'deepseek/deepseek-chat-v3.1',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `請搜索${materialName}的最新價格信息，包括供應商、價格、質量等級等詳細信息` }
      ],
      {
        max_tokens: 8000,
        temperature: 0.3,
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
    const aiResponse = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      searchResult: {
        materialName,
        content: aiResponse,
        searchType,
        searchedAt: new Date().toISOString(),
        source: 'AI Web Search'
      }
    })

  } catch (error) {
    console.error('網絡搜索錯誤:', error)
    return NextResponse.json(
      { success: false, error: '網絡搜索失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materialName = searchParams.get('materialName')
    const searchType = searchParams.get('searchType') || 'price'

    if (!materialName) {
      return NextResponse.json(
        { success: false, error: '缺少原料名稱參數' },
        { status: 400 }
      )
    }

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.OPENROUTER_API_KEY)
    if (!apiKeyValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    // 構建快速搜索提示
    const systemPrompt = `你是一個專業的原料價格搜索專家。請快速搜索${materialName}的最新價格信息。

請提供：
1. 最新市場價格
2. 主要供應商
3. 價格趨勢
4. 採購建議

請使用香港書面語繁體中文回答，信息要準確且最新。`

    const payload = buildBaseRequest(
      'deepseek/deepseek-chat-v3.1',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `請快速搜索${materialName}的最新價格` }
      ],
      {
        max_tokens: 8000,
        temperature: 0.3,
        top_p: 0.95,
        stream: false
      }
    )

    const response = await fetchOpenRouter(
      payload,
      process.env.OPENROUTER_API_KEY!,
      process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
    )


    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      searchResult: {
        materialName,
        content: aiResponse,
        searchType,
        searchedAt: new Date().toISOString(),
        source: 'AI Quick Search'
      }
    })

  } catch (error) {
    console.error('快速搜索錯誤:', error)
    return NextResponse.json(
      { success: false, error: '快速搜索失敗，請稍後再試' },
      { status: 500 }
    )
  }
}
