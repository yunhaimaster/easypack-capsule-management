import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createSSEEncoder, sendSSEEvent, parseStreamBuffer, createStreamResponse } from '@/lib/ai/streaming-utils'
import { getOpenRouterHeaders, buildBaseRequest, fetchOpenRouter, getStandardModelCatalog } from '@/lib/ai/openrouter-utils'
import { validateApiKey, validateIngredients } from '@/lib/api/validation'
import { IngredientInput } from '@/types/api'

export const dynamic = 'force-dynamic'

const buildSystemPrompt = () => `你是一個專業的膠囊配方製粒分析專家。

請根據提供的配方，先完成完整的分析與第一次評分；其後在「改善後再評估」時，必須基於第一次評估的邏輯進行相對比較，而不是重新獨立打分。

請在輸出之前，內部先逐步推理每個原料的性質與影響，再彙總為結果。最終只顯示結論，推理過程隱藏。

**請使用 Markdown 格式輸出，包含粗體標題、表格和清晰的結構化內容。**

評分準則一致性：
- 所有評分必須基於同一套標準準則。
- 改善後的評估必須直接參考原始分數，只允許在原本評估邏輯下進行相對調整。
- 改善後的分數必須 ≤ 原始分數，且差異必須有明確的數據或專業理由支撐。
- 一般降幅應介乎 10–30 分；僅在極高風險情況才可接近 40 分。若配方本身已接近低風險，分數只能小幅下降。
- 不得出現不合理的大幅下降或上升。

輸出結構：
步驟 1. 原料性質分析
- 請逐一列出配方原料，評估流動性、黏性、結塊風險。
- 如資料欠缺，填入常見文獻範圍並標註為「假設值」。
- 以 Markdown 表格呈現，欄位 = 原料 | 特性 | 假設值/文獻參考 | 風險說明。

步驟 2. 製粒必要性初評分
- 綜合上述信息，給出 0–100 分的製粒必要性分數。
- 解釋分數依據。
- 額外提供《為何可能不需要製粒》的簡短判斷。

步驟 3. 流動性改善方案
- 只能從以下輔料中選擇：麥芽糊精、硬脂酸鎂、二氧化硅、微晶纖維素。
- 列出建議添加的品項、比例範圍（例如 0.2%–2%）、作用機制。
- 若不建議加任何輔料，解釋原因。
- 以 Markdown 表格呈現：輔料 | 建議比例% | 作用機制。

步驟 4. 改善後再評估
- 直接與第一次評分比較，不可從零開始重算。
- 以 Markdown 表格呈現：指標 | 原始配方 | 改善後配方 | 分數差異與原因。
- 指標至少包括：流動性、黏性、結塊風險、整體分數。
- 對整體分數欄位補充「原始分數」「改善後分數」及「分數差異說明」。

**請注意：**
- 僅在「實際有應用改善方案」時才調整分數。
- 如果沒有改善方案，或認為不需要改善，則改善後評分必須與原始評分**保持完全相同**。
- 不得無理由降低或提高分數。
- 分數變化必須對應具體的改善措施與理由。

**分數調整規則：**
- 若改善後配方 = 原配方，則分數差異應為 0。
- 若有小幅改善，分數下降幅度 <= 10 分。
- 若屬於重大改善，分數下降幅度 <= 30 分。
- 不可出現無改善卻減分的情況。

步驟 5. 總結
- 總結該配方的製粒必要性結論與改善後印象。
- 明確提醒：此評估僅供理論參考，需配合實驗驗證。

⚠️ 其他要求：
- 嚴格依照上述結構輸出，不得省略任何部分。
- **必須使用 Markdown 格式**，包括粗體標題、表格和條列式內容。
- 如資料不足，請標明「假設值」，不得憑空臆測。
- 請保持香港書面語繁體中文的專業但親切語調，避免簡體中文、台灣用詞或粵語口語，並使用正式書面表達。`

const formatIngredients = (ingredients: Array<{ materialName: string; unitContentMg: number }>) => {
  return ingredients
    .map((ing) => `${ing.materialName}: ${ing.unitContentMg}mg`)
    .join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const { ingredients, singleModel, reasoningMap } = await request.json()

    // Validate ingredients
    const ingredientValidation = validateIngredients(ingredients)
    if (!ingredientValidation.valid) {
      return NextResponse.json({ error: ingredientValidation.error }, { status: 400 })
    }

    const filteredIngredients = ingredientValidation.data!

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.OPENROUTER_API_KEY)
    if (!apiKeyValidation.valid) {
      return NextResponse.json({ error: 'AI 服務暫時無法使用，請稍後再試' }, { status: 500 })
    }

    const MODEL_CATALOG = getStandardModelCatalog()
    const selectedModels = singleModel
      ? MODEL_CATALOG.filter((model) => model.id === singleModel)
      : MODEL_CATALOG

    if (selectedModels.length === 0) {
      return NextResponse.json({ error: '未指定有效的模型' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt()
    const userPrompt = `請分析以下配方是否需要製粒：\n\n${formatIngredients(filteredIngredients)}\n\n請提供詳細的製粒必要性分析。`

    const basePayload = buildBaseRequest(
      'dummy-model', // Will be replaced per model
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        max_tokens: 8000,
        temperature: 0.3,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      }
    )

    const encoder = createSSEEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          sendSSEEvent(controller, encoder, event, data)
        }

        await Promise.all(
          selectedModels.map(async (model) => {
            sendEvent('start', { modelId: model.id, modelName: model.name })
            try {
              const payload = {
                ...basePayload,
                model: model.id
              }
              
              const response = await fetchOpenRouter(
                payload,
                process.env.OPENROUTER_API_KEY!,
                process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
              )

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
                const { events, remaining } = parseStreamBuffer(buffer)
                buffer = remaining

                for (const eventBlock of events) {
                  const lines = eventBlock.split('\n')
                  const dataPayload = ''

                  for (const line of lines) {
                    if (line.startsWith('data:')) {
                      const payload = line.replace('data:', '').trim()
                      if (!payload) continue

                      if (payload === '[DONE]') {
                        modelCompleted = true
                        sendEvent('done', { modelId: model.id })
                        continue
                      }

                      try {
                        const parsed = JSON.parse(payload)
                        const delta = parsed.choices?.[0]?.delta?.content
                        if (delta) {
                          sendEvent('delta', { modelId: model.id, delta })
                        }
                      } catch (_err) {
                        // 忽略單行解析錯誤
                      }
                    }
                  }
                }
              }

              if (!modelCompleted) {
                sendEvent('done', { modelId: model.id })
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : '分析過程中發生未知錯誤'
              sendEvent('error', { modelId: model.id, error: message })
            }
          })
        )

        sendEvent('close', { completed: true })
        controller.close()
      }
    })

    return createStreamResponse(stream)
  } catch (error) {
    logger.error('製粒分析總體錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json({ error: '製粒分析失敗，請稍後再試' }, { status: 500 })
  }
}