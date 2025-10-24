import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSSEEncoder, sendSSEEvent, parseStreamBuffer, createStreamResponse } from '@/lib/ai/streaming-utils'
import { getOpenRouterHeaders, buildBaseRequest, fetchOpenRouter, getStandardModelCatalog } from '@/lib/ai/openrouter-utils'
import { validateApiKey } from '@/lib/api/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { analysisType = 'comprehensive' } = await request.json()

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.OPENROUTER_API_KEY)
    if (!apiKeyValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    // 嘗試獲取訂單數據進行分析
    let ordersData: any[] = []
    let ingredientsData: any[] = []
    const productionData: any[] = []
    
    try {
      // 獲取訂單數據
      ordersData = await prisma.productionOrder.findMany({
        include: {
          ingredients: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
    } catch (dbError) {
      console.warn('訂單數據表不存在，使用空數據:', dbError)
      ordersData = []
    }

    try {
      // 獲取原料數據
      ingredientsData = await prisma.ingredient.findMany({
        take: 100
      })
    } catch (dbError) {
      console.warn('原料數據表不存在，使用空數據:', dbError)
      ingredientsData = []
    }

    // 分析訂單數據
    const analysisData = {
      totalOrders: ordersData.length,
      totalIngredients: ingredientsData.length,
      recentOrders: ordersData.slice(0, 10).map(order => ({
        id: order.id,
        customerName: order.customerName,
        productName: order.productName,
        orderDate: order.createdAt,
        ingredients: order.ingredients?.map((ing: any) => ({
          materialName: ing.materialName,
          unitContentMg: ing.unitContentMg
        })) || []
      })),
      popularIngredients: ingredientsData.slice(0, 20).map((ing: any) => ({
        name: ing.materialName,
        category: ing.category,
        description: ing.description
      })),
      orderTrends: {
        recentMonths: ordersData.filter(order => {
          const orderDate = new Date(order.createdAt)
          const threeMonthsAgo = new Date()
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
          return orderDate >= threeMonthsAgo
        }).length,
        totalValue: ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      }
    }

    const systemPrompt = `你是一個專業的保健品原料數據分析專家，專門為膠囊灌裝工廠提供原料使用分析。

分析類型：${analysisType}

訂單數據分析：
- 總訂單數：${analysisData.totalOrders}
- 總原料數：${analysisData.totalIngredients}
- 最近3個月訂單：${analysisData.orderTrends.recentMonths}
- 總訂單價值：HK$${analysisData.orderTrends.totalValue.toLocaleString()}

最近訂單詳情：
${JSON.stringify(analysisData.recentOrders, null, 2)}

熱門原料：
${JSON.stringify(analysisData.popularIngredients, null, 2)}

請提供以下分析：

## 1. 原料使用趨勢分析
- 最常用的原料排名
- 原料使用頻率分析
- 季節性使用模式

## 2. 客戶需求分析
- 客戶偏好分析
- 產品類型趨勢
- 訂單規模分析

## 3. 生產效率分析
- 原料庫存建議
- 採購優化建議
- 成本控制建議

## 4. 市場洞察
- 市場需求預測
- 新興原料趨勢
- 競爭對手分析

## 5. 業務建議
- 原料採購策略
- 庫存管理優化
- 客戶服務改進

請使用香港書面語繁體中文回答，確保分析專業、準確且實用。`

    const payload = buildBaseRequest(
      'deepseek/deepseek-v3.1-terminus',
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `請分析我們的訂單數據，提供原料使用洞察和業務建議` }
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
      analysis: {
        content: aiResponse,
        analysisType,
        dataSummary: {
          totalOrders: analysisData.totalOrders,
          totalIngredients: analysisData.totalIngredients,
          recentOrders: analysisData.orderTrends.recentMonths,
          totalValue: analysisData.orderTrends.totalValue
        },
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('原料分析錯誤:', error)
    return NextResponse.json(
      { success: false, error: '原料分析失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisType = searchParams.get('analysisType') || 'comprehensive'

    // 快速分析模式
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    const systemPrompt = `你是一個專業的保健品原料數據分析專家。請快速分析原料使用情況。

分析類型：${analysisType}

請提供：
1. 原料使用趨勢
2. 客戶需求分析
3. 採購建議
4. 庫存優化建議

請使用香港書面語繁體中文回答，信息要準確且實用。`

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://easypack-capsule-management.vercel.app',
        'X-Title': 'Easy Health AI Quick Ingredient Analysis'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.1-terminus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `請快速分析原料使用情況` }
        ],
        max_tokens: 8000,
        temperature: 0.3,
        top_p: 0.95
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API 錯誤:', errorText)
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法回應，請稍後再試' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      analysis: {
        content: aiResponse,
        analysisType,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('快速原料分析錯誤:', error)
    return NextResponse.json(
      { success: false, error: '快速分析失敗，請稍後再試' },
      { status: 500 }
    )
  }
}
