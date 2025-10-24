import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSSEEncoder, sendSSEEvent, parseStreamBuffer, createStreamResponse } from '@/lib/ai/streaming-utils'
import { getOpenRouterHeaders, buildBaseRequest, fetchOpenRouter, getStandardModelCatalog } from '@/lib/ai/openrouter-utils'
import { validateApiKey } from '@/lib/api/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { materialName, analysisType } = await request.json()

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.OPENROUTER_API_KEY)
    if (!apiKeyValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    // 嘗試獲取歷史價格數據，如果表不存在則使用空數組
    let priceData: any[] = []
    try {
      priceData = await prisma.ingredientPrice.findMany({
        where: {
          materialName: {
            contains: materialName,
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    } catch (dbError) {
      console.warn('價格數據表不存在，使用空數據:', dbError)
      priceData = []
    }

    const systemPrompt = `你是一個專業的原料價格分析專家，專門為保健品公司提供價格分析和採購建議。

分析對象：${materialName}
分析類型：${analysisType || 'comprehensive'}

歷史價格數據：
${JSON.stringify(priceData, null, 2)}

請提供：
1. 價格趨勢分析
2. 供應商比較
3. 採購建議
4. 成本優化建議
5. 市場預測

請使用香港書面語繁體中文回答，確保分析專業、準確且實用。`

    const payload = buildBaseRequest(
      'deepseek/deepseek-v3.1-terminus',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `請分析${materialName}的價格趨勢和採購建議` }
      ],
      {
        max_tokens: 6000,       // 優化 token 使用
        temperature: 0.2,       // 適度提高分析深度
        top_p: 0.9,            // 優化分析準確性
        frequency_penalty: 0.0,  // 允許重複關鍵分析點
        presence_penalty: 0.0,   // 不避免重要分析概念
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
      analysis: {
        materialName,
        content: aiResponse,
        priceData: priceData.map(price => ({
          id: price.id,
          materialName: price.materialName,
          supplier: price.supplier,
          price: price.price,
          currency: price.currency,
          unit: price.unit,
          minimumOrder: price.minimumOrder,
          leadTime: price.leadTime,
          quality: price.quality,
          source: price.source,
          validFrom: price.validFrom,
          validTo: price.validTo,
          createdAt: price.createdAt,
          updatedAt: price.updatedAt
        })),
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('價格分析錯誤:', error)
    return NextResponse.json(
      { success: false, error: '價格分析失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const materialName = searchParams.get('materialName')

    if (!materialName) {
      return NextResponse.json(
        { success: false, error: '缺少原料名稱參數' },
        { status: 400 }
      )
    }

    // 嘗試獲取價格數據，如果表不存在則使用空數組
    let priceData: any[] = []
    try {
      priceData = await prisma.ingredientPrice.findMany({
        where: {
          materialName: {
            contains: materialName,
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      })
    } catch (dbError) {
      console.warn('價格數據表不存在，使用空數據:', dbError)
      priceData = []
    }

    return NextResponse.json({
      success: true,
      data: {
        priceData: priceData.map(price => ({
          id: price.id,
          materialName: price.materialName,
          supplier: price.supplier,
          price: price.price,
          currency: price.currency,
          unit: price.unit,
          minimumOrder: price.minimumOrder,
          leadTime: price.leadTime,
          quality: price.quality,
          source: price.source,
          validFrom: price.validFrom,
          validTo: price.validTo,
          createdAt: price.createdAt,
          updatedAt: price.updatedAt
        }))
      }
    })

  } catch (error) {
    console.error('獲取價格數據錯誤:', error)
    return NextResponse.json(
      { success: false, error: '獲取價格數據失敗' },
      { status: 500 }
    )
  }
}