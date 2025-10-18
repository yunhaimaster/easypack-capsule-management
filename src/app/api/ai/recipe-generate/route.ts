import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'

const MODEL_CATALOG = [
  { id: 'deepseek/deepseek-chat-v3.1', name: 'DeepSeek Chat v3.1' },
  { id: 'openai/gpt-4.1-mini', name: 'OpenAI GPT-4.1 Mini' },
  { id: 'x-ai/grok-4-fast', name: 'xAI Grok 4 Fast' }
]

export async function POST(request: NextRequest) {
  try {
    const {
      targetEffect,
      targetAudience,
      dosageForm,
      budget,
      enableReasoning,
      reasoningMap,
      singleModel
    } = await request.json()

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    const selectedModels = singleModel
      ? MODEL_CATALOG.filter(model => model.id === singleModel)
      : MODEL_CATALOG

    if (selectedModels.length === 0) {
      return NextResponse.json(
        { success: false, error: '未指定有效的模型' },
        { status: 400 }
      )
    }

    const systemPrompt = `你是膠囊代工廠的研發顧問 AI，根據客戶需求生成符合膠囊灌裝代工場景的專業配方。請嚴格按照以下框架輸出，並以繁體中文回答：

用戶需求：
- 目標功效：${targetEffect}
- 目標受眾：${targetAudience || '一般成人'}
- 劑型：膠囊（固定）
- 特別要求：${budget || '無特殊要求'}

🎯 輸出框架

## 1. 配方基本資訊
- 專業產品名稱（不要直接用用戶輸入）
- 產品描述與功效說明
- 代工定位說明
- 廣告語建議（簡短、合規、不涉醫療）

## 2. 配方原料（表格：原料 | 劑量 | 功能 | 備註）
- 主成分：基於功效需求
- 輔料：僅限常見灌裝用（MCC、麥芽糊精、二氧化矽、硬脂酸鎂），並說明作用
- 註明建議來源（專利版/常規原料）

## 3. 膠囊規格建議
- 表格呈現：原料重量、假設堆積密度、體積 → 混合總體積
- 根據粉劑體積，選擇合適的膠囊號（限 00、0、1，並含安全係數）
- 建議膠囊材料（明膠/HPMC）與顏色（考慮粉末透色/染色風險）

## 4. 功效與安全評分
- 功效評分（1–10 分），給出依據（文獻/傳統使用）
- 安全評分（1–10 分），評估配伍與風險
- 評分理由（簡述）

## 5. 代工生產建議
- 灌裝可行性（流動性/是否需製粒）
- 生產工藝與質控注意點
- 包裝建議（瓶裝/泡罩，含 MOQ 參考）

## 6. 法規與合規性
- 針對香港必須遵守的標籤規範與禁限用要求
- 區分「必須標示」「建議標示」「禁止標示」
- 指出潛在需要調整的成分（如銷往大陸或歐美）

⚠️ 注意：生成的配方僅供理論參考，不能視為醫療建議，最終需結合法規與實驗驗證。`

    const basePayload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `請為我生成一個${targetEffect}的${dosageForm || '膠囊'}配方` }
      ],
      max_tokens: 8000,
      temperature: 0.3,
      top_p: 0.95,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: true
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }

        await Promise.all(
          selectedModels.map(async (model) => {
            sendEvent('start', { modelId: model.id, modelName: model.name })

            try {
              const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://easypack-capsule-management.vercel.app',
                  'X-Title': `Easy Health AI Recipe Generator (${model.name})`
                },
                body: JSON.stringify({
                  ...basePayload,
                  model: model.id
                  // Removed all reasoning/thinking parameters - models run as-is
                })
              })

              if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || '模型請求失敗')
              }

              if (!response.body) {
                throw new Error('模型沒有返回任何資料')
              }

              const reader = response.body.getReader()
              const decoder = new TextDecoder()
              let buffer = ''
              let modelCompleted = false

              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })

                const events = buffer.split('\n\n')
                buffer = events.pop() || ''

                for (const eventBlock of events) {
                  const lines = eventBlock.split('\n')
                  let dataPayload = ''

                  for (const line of lines) {
                    if (line.startsWith('data:')) {
                      dataPayload += line.replace('data:', '').trim()
                    }
                  }

                  if (!dataPayload) continue

                  if (dataPayload === '[DONE]') {
                    modelCompleted = true
                    sendEvent('done', { modelId: model.id })
                    continue
                  }

                  try {
                    const parsed = JSON.parse(dataPayload)
                    const delta = parsed.choices?.[0]?.delta?.content
                    if (delta) {
                      sendEvent('delta', { modelId: model.id, delta })
                    }
                  } catch (_err) {
                    // 忽略解析錯誤
                  }
                }
              }

              if (!modelCompleted) {
                sendEvent('done', { modelId: model.id })
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : '未知錯誤'
              sendEvent('error', { modelId: model.id, error: message })
            }
          })
        )

        sendEvent('close', { completed: true })
        controller.close()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (error) {
    console.error('AI 配方生成錯誤:', error)
    return NextResponse.json(
      { success: false, error: '配方生成失敗，請稍後再試' },
      { status: 500 }
    )
  }
}