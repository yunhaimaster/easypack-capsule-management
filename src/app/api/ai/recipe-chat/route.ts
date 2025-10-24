import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json()

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    // 構建系統提示，包含當前配方上下文
    const systemPrompt = `你是一個專業的膠囊配方優化 AI 助手，專門為膠囊灌裝工廠提供服務。用戶已經生成了一個配方，現在希望進一步優化和修改。

請記住以下重要原則：
1. 你是一個專業的膠囊工廠配方專家
2. 熟悉膠囊灌裝工藝和生產流程
3. 了解膠囊規格、材料和成本控制
4. 熟悉香港保健品法規和標籤要求
5. 重視成本效益和生產可行性
6. 能夠提供具體的膠囊規格建議

當前配方上下文：
${context?.currentRecipe ? `配方名稱：${context.currentRecipe.name || '未命名'}
目標功效：${context?.originalRequest?.targetEffect || '未指定'}
目標受眾：${context?.originalRequest?.targetAudience || '一般成人'}
劑型：膠囊（固定）` : '無當前配方'}

請根據用戶的需求，提供專業的膠囊工廠優化建議。你可以：
- 調整膠囊規格（顏色、大小、材料）
- 優化原料配比和劑量
- 提高生產效率
- 改善產品穩定性
- 優化包裝方案
- 提供生產工藝建議
- 提供質量控制要點
- 符合特定認證要求
- 滿足特殊客戶需求

請使用香港書面語繁體中文回答，確保內容專業、準確且符合膠囊工廠的實際需求。`

    // 轉換消息格式
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ]

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://easypack-capsule-management.vercel.app',
        'X-Title': 'Easy Health AI Recipe Chat'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.1-terminus',
        messages: apiMessages,
        max_tokens: 8000,
        temperature: 0.1,
        top_p: 0.95,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
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
    const aiResponse = data.choices?.[0]?.message?.content || '抱歉，我暫時無法回應。'

    return NextResponse.json({
      success: true,
      message: aiResponse
    })

  } catch (error) {
    console.error('AI 聊天錯誤:', error)
    return NextResponse.json(
      { success: false, error: '聊天服務暫時無法使用，請稍後再試' },
      { status: 500 }
    )
  }
}
