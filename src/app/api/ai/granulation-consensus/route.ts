import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'

interface ConsensusRequest {
  ingredients?: Array<{
    materialName: string
    unitContentMg: number
    isCustomerProvided?: boolean
  }>
  analyses?: Array<{
    modelId: string
    modelName: string
    content: string
  }>
  enableReasoning?: boolean
}

const MIN_ANALYSES_REQUIRED = 2

const buildSystemPrompt = () => `你是一位專業的膠囊工廠製粒決策仲裁者。請閱讀多個 AI 模型的製粒分析，找出共識與分歧，並輸出單一、可執行的最終結論。

請嚴格依以下結構，以香港書面語繁體中文回答（使用 Markdown）：
## 共識重點
- 列出三個最重要的共同觀點（如有）
## 分歧與原因
- 逐點說明分歧，指出來源與合理性
## 最終結論（是否需要製粒）
- 「需要/不需要」二擇一，並給出\`0–100\`的製粒必要性分數
- 用2–3點數據化理由支撐
## 建議方案（如需要）
- 只能從：麥芽糊精、硬脂酸鎂、二氧化硅、微晶纖維素 四者中選擇
- 表格：輔料 | 建議比例% | 作用機制
## 改善後再評估（相對於原始）
- 表格：指標 | 原始 | 改善後 | 差異原因（堅持「不能無故降分」原則）
## 可信度
- 以\`低/中/高\`標註，並說明依據（例如模型一致性、論據嚴謹度）

注意：
- 僅在「確有改善方案」時才調整分數；無改善時分數必須相同。
- 不可使用未列出的輔料；資料不足之處以「假設值」標註。
- 保持專業但親切的香港書面語語氣。`

const formatIngredients = (ingredients: ConsensusRequest['ingredients']) => {
  if (!ingredients || ingredients.length === 0) {
    return '(無資料)'
  }

  return ingredients
    .filter((ing) => ing.materialName)
    .map((ing) => {
      const base = `- ${ing.materialName}：\`${Number(ing.unitContentMg) || 0} mg/粒\``
      return ing.isCustomerProvided ? `${base}（客戶提供）` : base
    })
    .join('\n')
}

const formatAnalyses = (analyses: ConsensusRequest['analyses']) => {
  if (!analyses || analyses.length === 0) {
    return '(無分析內容)'
  }

  return analyses
    .filter((item) => item?.modelName && item?.content)
    .map((item, index) => `### 模型 ${index + 1}：${item.modelName}\n${item.content}`)
    .join('\n\n')
}

export async function POST(request: NextRequest) {
  try {
    const { ingredients = [], analyses = [], enableReasoning = false } = (await request.json()) as ConsensusRequest

    if (!Array.isArray(analyses) || analyses.filter((item) => item?.content?.trim()).length < MIN_ANALYSES_REQUIRED) {
      return NextResponse.json(
        { success: false, error: '至少需要兩個有效的模型分析結果才能生成最終結論' },
        { status: 400 }
      )
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    const systemPrompt = buildSystemPrompt()
    const userPrompt = `以下為當前配方與多個模型的分析：
## 配方
${formatIngredients(ingredients)}

## 模型分析
${formatAnalyses(analyses)}

請綜合以上內容，產出單一最終結論與建議。`

    const upstreamResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://easypack-capsule-management.vercel.app',
        'X-Title': 'Granulation Consensus Synthesizer'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        top_p: 0.95,
        stream: true
        // Removed thinking_enabled - model runs as-is
      })
    })

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      const errorText = await upstreamResponse.text().catch(() => '')
      logger.error('Granulation consensus upstream error', {
        status: upstreamResponse.status,
        error: errorText
      })
      return new Response('Consensus upstream error', { status: 502 })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }

        sendEvent('start', { modelId: 'consensus', modelName: '交叉驗證結論' })

        try {
          const reader = upstreamResponse.body!.getReader()
          let buffer = ''
          let finalText = ''

          while (true) {
            const { value, done } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const events = buffer.split('\n\n')
            buffer = events.pop() || ''

            for (const block of events) {
              const dataLine = block.split('\n').find((line) => line.startsWith('data:'))
              if (!dataLine) continue

              const payload = dataLine.replace(/^data:\s*/, '')
              if (!payload) continue

              if (payload === '[DONE]') {
                sendEvent('done', {
                  modelId: 'consensus',
                  success: true,
                  content: finalText
                })
                controller.close()
                return
              }

              try {
                const json = JSON.parse(payload)
                const delta = json?.choices?.[0]?.delta?.content
                if (delta) {
                  finalText += delta
                  sendEvent('delta', { modelId: 'consensus', delta })
                }
              } catch (_error) {
                // ignore malformed chunks
              }
            }
          }

          sendEvent('done', {
            modelId: 'consensus',
            success: true,
            content: finalText
          })
          controller.close()
        } catch (error) {
          const message = error instanceof Error ? error.message : '生成最終結論時發生錯誤'
          logger.error('Granulation consensus stream error', { error: message })
          sendEvent('error', { modelId: 'consensus', error: message })
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (error) {
    logger.error('Granulation consensus handler error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { success: false, error: '生成最終結論失敗，請稍後再試' },
      { status: 500 }
    )
  }
}


