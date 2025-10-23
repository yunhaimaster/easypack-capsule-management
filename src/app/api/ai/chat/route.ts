import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { CleanOrderData, OrderWithIngredients } from '@/types/api'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'

export const dynamic = 'force-dynamic'

// 清理訂單數據，移除系統內部ID，只保留用戶相關信息
function cleanOrderData(orders: any[]): CleanOrderData[] {
  return orders.map(order => ({
    customerName: order.customerName,
    productName: order.productName,
    productionQuantity: order.productionQuantity,
    unitWeightMg: order.unitWeightMg,
    batchTotalWeightMg: order.batchTotalWeightMg,
    capsuleColor: order.capsuleColor,
    capsuleSize: order.capsuleSize,
    capsuleType: order.capsuleType,
    completionDate: order.completionDate,
    processIssues: order.processIssues,
    qualityNotes: order.qualityNotes,
    customerService: order.customerService,
    notes: order.notes,
    productionStatus: order.productionStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  }))
}

const DEFAULT_SUGGESTIONS = [
  '分析填充可行性',
  '分析製粒必要性',
  '分析成分顏色與膠囊染色風險',
  '分析文件與標籤合規性',
  '分析配方功效與廣告用語合規建議'
]

function sanitizeChunk(text: string): string {
  if (!text) return ''
  return text
    .replace(/<\|begin_of_sentence\s*\|>/g, '')
    .replace(/<\|end_of_sentence\s*\|>/g, '')
    .replace(/<\|begin_of_sentence\s*\|/g, '')
    .replace(/<\|end_of_sentence\s*\|/g, '')
    .replace(/<\|.*?\|>/g, '')
    .replace(/<\|.*?\|/g, '')
    .replace(/<\|.*?>/g, '')
    .replace(/<\|.*?/g, '')
    .replace(/<\|/g, '')
    .replace(/\|>/g, '')
}

function sanitizeFinal(text: string): string {
  return sanitizeChunk(text).trim()
}

async function generateSuggestions(
  aiResponse: string,
  userMessage: string,
  OPENROUTER_API_URL: string,
  OPENROUTER_API_KEY: string
): Promise<string[]> {
  if (!aiResponse) {
    return [...DEFAULT_SUGGESTIONS]
  }

  let suggestions: string[] = []

  // 動態建議生成 - 調試信息已移除

  try {
    const suggestionsResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://easypack-capsule-management.vercel.app',
        'X-Title': 'Easy Health AI Assistant'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1',
        messages: [
          {
            role: 'user',
            content: `基於以下AI回答，生成4個相關的膠囊灌裝問題：

AI回答：${aiResponse}

請生成4個與膠囊灌裝相關的問題，每行一個，以問號結尾。
重要：不要包含編號（如1. 2. 3. 4.），只生成純問題內容。
語言要求：請使用香港書面語繁體中文，使用繁體中文字符和香港常用的專業術語，避免粵語口語。
格式要求：問題應該簡潔明瞭，適合忙碌的用戶快速理解。`
          }
        ],
        max_tokens: 800,         // 優化 token 使用
        temperature: 0.5,        // 平衡創意與一致性
        top_p: 0.9,             // 優化多樣性
        frequency_penalty: 0.1,  // 減少重複建議
        presence_penalty: 0.1    // 鼓勵新話題
      })
    })

    if (suggestionsResponse.ok) {
      const suggestionsData = await suggestionsResponse.json()
      const suggestionsText = suggestionsData.choices?.[0]?.message?.content || ''

      suggestions = suggestionsText.split('\n')
        .filter((s: string) => s.trim())
        .map((s: string) => s.trim().replace(/^[1-4]\.\s*/, ''))
        .filter((s: string) => {
          return s.length > 5 &&
            !s.includes('<|') &&
            !s.includes('begin_of_sentence') &&
            !s.includes('end_of_sentence') &&
            !s.includes('用正體中文') &&
            !s.includes('用中文') &&
            !s.includes('問題用中文') &&
            !s.includes('請用中文') &&
            !s.includes('請用正體中文') &&
            !s.includes('用繁體中文') &&
            !s.includes('請用繁體中文')
        })
        .slice(0, 4)

        // 建議已過濾

      if (suggestions.length < 4) {
        // 使用更寬鬆的過濾條件
        suggestions = suggestionsText.split('\n')
          .filter((s: string) => s.trim())
          .map((s: string) => s.trim().replace(/^[1-4]\.\s*/, ''))
          .filter((s: string) => {
            return s.length > 3 &&
              !s.includes('<|') &&
              !s.includes('用正體中文') &&
              !s.includes('用中文') &&
              !s.includes('問題用中文') &&
              !s.includes('請用中文') &&
              !s.includes('請用正體中文') &&
              !s.includes('用繁體中文') &&
              !s.includes('請用繁體中文')
          })
          .slice(0, 4)
        // 寬鬆過濾完成
      }
    } else {
      const errorText = await suggestionsResponse.text()
      logger.error('建議 API 失敗', {
        status: suggestionsResponse.status,
        errorText
      })
    }
  } catch (error) {
    logger.error('生成動態建議時發生錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
  }

  if (suggestions.length === 0) {
    // 使用默認建議
    suggestions = [...DEFAULT_SUGGESTIONS]
  }

  // 返回最終建議

  return suggestions
}

async function streamOpenRouterResponse(
  openRouterResponse: Response,
  controller: ReadableStreamDefaultController
): Promise<string> {
  const reader = openRouterResponse.body?.getReader()
  if (!reader) {
    throw new Error('OpenRouter 回應缺少 body')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let finalText = ''

  const processEvent = (rawEvent: string): 'continue' | 'done' => {
    const lines = rawEvent.split('\n')
    let dataPayload = ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('data:')) {
        const dataContent = trimmed.replace(/^data:\s*/, '')
        dataPayload += dataPayload ? `\n${dataContent}` : dataContent
      }
    }

    if (!dataPayload) {
      return 'continue'
    }

    if (dataPayload === '[DONE]') {
      return 'done'
    }

    try {
      const json = JSON.parse(dataPayload)
      const choice = json.choices?.[0]
      
      // 處理 reasoning 思考過程
      if (choice?.delta?.reasoning) {
        const reasoningDelta = choice.delta.reasoning
        if (reasoningDelta) {
          const sanitized = sanitizeChunk(reasoningDelta)
          if (sanitized) {
            controller.enqueue(`event: reasoning\ndata: ${JSON.stringify(sanitized)}\n\n`)
          }
        }
      }
      
      // 處理 content 回答內容
      const delta = choice?.delta?.content || ''
      if (delta) {
        const sanitized = sanitizeChunk(delta)
        if (sanitized) {
          finalText += sanitized
          controller.enqueue(`event: delta\ndata: ${JSON.stringify(sanitized)}\n\n`)
        }
      }
    } catch (error) {
      logger.error('解析流資料時出錯', {
        error: error instanceof Error ? error.message : String(error)
      })
    }

    return 'continue'
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) {
      buffer += decoder.decode()
      break
    }

    buffer += decoder.decode(value, { stream: true })

    let eventBoundary = buffer.indexOf('\n\n')
    while (eventBoundary !== -1) {
      const rawEvent = buffer.slice(0, eventBoundary)
      buffer = buffer.slice(eventBoundary + 2)
      const result = processEvent(rawEvent)
      if (result === 'done') {
        return finalText
      }
      eventBoundary = buffer.indexOf('\n\n')
    }
  }

  if (buffer.trim()) {
    const result = processEvent(buffer)
    if (result === 'done') {
      return finalText
    }
  }

  return finalText
}

export async function POST(request: NextRequest) {
  try {
    const { message, orders, context } = await request.json()

    // Get user context for audit logging
    const auditContext = await getUserContextFromRequest(request)

    // Log AI chat interaction (sanitize message to not expose full content)
    await logAudit({
      action: AuditAction.AI_CHAT_INTERACTION,
      userId: auditContext.userId,
      phone: auditContext.phone,
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
      metadata: {
        hasOrders: !!orders && orders.length > 0,
        orderCount: orders ? orders.length : 0,
        contextPage: context?.currentPage || 'unknown',
        messageLength: message?.length || 0
      }
    })

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'

  if (!OPENROUTER_API_KEY) {
    logger.error('OpenRouter API 密鑰未配置')
      return NextResponse.json(
        { error: 'AI 服務暫時無法使用，請稍後再試或聯繫技術支援' },
        { status: 500 }
      )
    }

    const cleanedOrders = orders ? cleanOrderData(orders) : []
    const isSingleOrder = cleanedOrders && cleanedOrders.length === 1
    const hasContext = context && context.currentPage

    let systemPrompt = ''

    if (isSingleOrder) {
      systemPrompt = `你是一個專業的膠囊配方管理系統 AI 助手。用戶正在查看一個特定的生產訂單，請針對這個訂單進行詳細分析並結構化輸出。

當前訂單數據：
${JSON.stringify(cleanedOrders[0], null, 2)}

請按照以下五要素格式進行分析：

## 1. 配方與原料分析
- 表列原料、重量、假設或已知堆積密度
- 計算各原料體積與總容積（標註假設範圍）
- 分析原料配比和重量分配合理性

## 2. 膠囊規格檢查
- 比對總容積與指定膠囊號容量（00/0/1）
- 評估是否能順利填充
- 提出關於顏色或材質的建議
- 檢查膠囊規格是否合適

## 3. 生產可行性評估
- 評估流動性、結塊風險、卡機可能性
- 提出「需不需製粒」或「是否建議加輔料」的建議
- 分析可能影響產線效率的因素
- 提供生產工藝優化建議

## 4. 質控與風險分析
- 建立表格列出「可能風險 | 風險分數(0–100) | 改善措施」
- 分析品質風險點和製程問題
- 評估原料相互作用和穩定性
- 提供品管備註和注意事項

## 5. 合規與標籤提醒
- 初步檢視成分是否涉及限量／常見法規敏感成分
- 建議合法的功能描述詞（避免療效用語）
- 區分可標示的保健聲稱 / 禁止的醫療聲稱
- 標註為「僅供初步參考，需法規部門確認」

⚠️ 重要提醒：
- 若資料缺失，請輸出「假設值／文獻參考」而非臆造精確數據
- 專注於膠囊灌裝代工實務，包括流動性問題、法規風險提醒
- 回答必須以完整的句子結束，不要包含任何未完成的文字或特殊標記

語言要求：請嚴格使用香港書面語繁體中文，包括：
- 使用繁體中文字符
- 使用香港常用的專業術語
- 保持專業但親切的書面語語調
- 避免簡體中文、台灣用詞或粵語口語
- 使用正式的書面表達方式

版面格式要求：為了方便忙碌的用戶和手機用戶閱讀，請使用以下格式：
- 優先使用分點列表（• 或 -）來組織信息
- 使用表格來展示數據對比和統計
- 使用標題（## 或 ###）來分段組織內容
- 重要信息使用**粗體**標記
- 數字和關鍵數據使用\`代碼格式\`突出顯示
- 避免長段落，多用短句和分點
- 確保內容在手機屏幕上易於閱讀

特別注意：不要提及任何系統內部ID或編號，只使用客戶名稱、產品名稱等用戶友好的信息來描述訂單。`
    } else if (hasContext) {
      const cleanedCurrentOrder = context.currentOrder ? cleanOrderData([context.currentOrder])[0] : null
      const cleanedRecentOrders = context.recentOrders ? cleanOrderData(context.recentOrders) : []

      systemPrompt = `你是一個專業的膠囊配方管理系統智能 AI 助手。用戶當前正在 "${context.pageDescription}"，請提供跨訂單比較與全局趨勢的洞察。

當前頁面信息：
- 頁面：${context.currentPage}
- 描述：${context.pageDescription}
- 時間：${context.timestamp}
- 訂單總數：${context.ordersCount}
- 是否有當前訂單：${context.hasCurrentOrder ? '是' : '否'}

${cleanedCurrentOrder ? `當前查看的訂單：
${JSON.stringify(cleanedCurrentOrder, null, 2)}` : ''}

${cleanedRecentOrders && cleanedRecentOrders.length > 0 ? `最近的訂單數據：
${JSON.stringify(cleanedRecentOrders, null, 2)}` : ''}

${cleanedOrders && cleanedOrders.length > 0 ? `完整的訂單數據庫統計：
- 總訂單數：${cleanedOrders.length}
- 未完工訂單數：${cleanedOrders.filter((order: CleanOrderData) => !order.completionDate).length}
- 已完工訂單數：${cleanedOrders.filter((order: CleanOrderData) => order.completionDate).length}

當用戶詢問具體訂單信息時，請從以下完整數據中篩選：
${JSON.stringify(cleanedOrders, null, 2)}` : ''}

⚡ 回答要求：
1. 提供 **快速摘要**（重點結論 / 建議） + **詳細數據分析**兩層內容
2. 所有數值必須引用 \`cleanedOrders\` 或 \`recentOrders\`，禁止憑空假設
3. 必須使用表格、分點列表與標題組織輸出，重要數據需加粗或用 \`代碼格式\`

🎯 分析模組：
- **跨訂單比較**：配方特徵、膠囊規格、原料用量差異
- **全局趨勢**：生產總量變化、熱門客戶/熱門原料/熱門功效
- **產能與效率**：平均完成時間、最長最短交期、單均膠囊數
- **膠囊規格分布**：統計 00/0/1 號膠囊使用比例，提出庫存管理建議
- **異常檢測**：找出交期異常、裝量異常或體積超標等問題
- **法規與市場提醒**：若配方含疑似法規敏感成分，標註需人工確認

📊 KPI 指標輸出：
- 平均生產完成時間
- 每個客戶單均膠囊數量
- 最近 30 天訂單數增減率
- 產能利用率分析
- 常用膠囊號碼分佈統計
- 原料使用趨勢分析

⚠️ 重要提醒：
- 當用戶詢問"未完工訂單"時，請查看完整的訂單數據庫，篩選 completionDate 為 null 的訂單，並逐一列出所有未完工訂單的詳細信息
- 當用戶詢問"已完工訂單"時，請查看完整的訂單數據庫，篩選 completionDate 不為 null 的訂單
- 請使用完整的訂單數據進行統計和分析，而不僅僅是最近的訂單
- 確保回答完整，不要截斷，如果訂單數據較多請分段展示但要包含所有相關訂單
- 專注於宏觀分析，避免跳進去分析某個具體原料
- 若發現異常數據或超出常規的情況，要特別標記並提出原因推測與改善建議
- 禁止生成任意數據，所有數值必須來自給定的 \`cleanedOrders\` 或 \`recentOrders\`，否則需標註「無資料」

請使用香港書面語繁體中文回答，並提供具體的數據支持和專業建議。如果數據中有日期，請使用適當的日期格式。

重要：請確保回答內容乾淨整潔，不要包含任何特殊標記或格式符號。回答必須以完整的句子結束，不要包含任何未完成的文字或特殊標記。

語言要求：請嚴格使用香港書面語繁體中文，包括：
- 使用繁體中文字符
- 使用香港常用的專業術語
- 保持專業但親切的書面語語調
- 避免簡體中文、台灣用詞或粵語口語
- 使用正式的書面表達方式

版面格式要求：為了方便忙碌的用戶和手機用戶閱讀，請使用以下格式：
- 優先使用分點列表（• 或 -）來組織信息
- 使用表格來展示數據對比和統計
- 使用標題（## 或 ###）來分段組織內容
- 重要信息使用**粗體**標記
- 數字和關鍵數據使用\`代碼格式\`突出顯示
- 避免長段落，多用短句和分點
- 確保內容在手機屏幕上易於閱讀

特別注意：不要提及任何系統內部ID或編號，只使用客戶名稱、產品名稱等用戶友好的信息來描述訂單。`
    } else {
      systemPrompt = `你是一個專業的膠囊配方管理系統 AI 助手。請提供整潔的數據統計和 dashboard 樣式的回答。

系統數據：
${JSON.stringify(cleanedOrders, null, 2)}

請專注於以下查詢類型（保持數據統計的整潔，適合客服直接 copy/paste）：
1. **客戶訂單查詢**：查詢特定客戶的所有訂單
2. **生產狀態統計**：分析未完工/已完工訂單數量
3. **原料使用統計**：統計各原料的使用頻率和用量
4. **產品訂單分析**：查找特定產品的所有訂單
5. **生產趨勢分析**：分析時間序列的生產數據
6. **數據計算**：提供統計數據和計算結果
7. **訂單篩選**：根據各種條件篩選訂單

回答格式要求：
- 使用表格展示統計數據
- 使用分點列表組織信息
- 重要數據使用**粗體**標記
- 數字使用\`代碼格式\`突出顯示
- 避免長段落，保持簡潔
- 適合直接複製到報告或郵件中

請使用香港書面語繁體中文回答，並提供具體的數據支持。如果數據中有日期，請使用適當的日期格式。

重要：請確保回答內容乾淨整潔，不要包含任何特殊標記或格式符號。回答必須以完整的句子結束，不要包含任何未完成的文字或特殊標記。

語言要求：請嚴格使用香港書面語繁體中文，包括：
- 使用繁體中文字符
- 使用香港常用的專業術語
- 保持專業但親切的書面語語調
- 避免簡體中文、台灣用詞或粵語口語
- 使用正式的書面表達方式

版面格式要求：為了方便忙碌的用戶和手機用戶閱讀，請使用以下格式：
- 優先使用分點列表（• 或 -）來組織信息
- 使用表格來展示數據對比和統計
- 使用標題（## 或 ###）來分段組織內容
- 重要信息使用**粗體**標記
- 數字和關鍵數據使用\`代碼格式\`突出顯示
- 避免長段落，多用短句和分點
- 確保內容在手機屏幕上易於閱讀

特別注意：不要提及任何系統內部ID或編號，只使用客戶名稱、產品名稱等用戶友好的信息來描述訂單。`
    }

    const upstreamResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://easypack-capsule-management.vercel.app',
        'X-Title': 'Easy Health AI Assistant'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 32000,       // 設置到極限，確保完整分析不被截斷
        temperature: 0.2,        // 降低溫度，提高一致性
        top_p: 0.95,            // 稍微提高 top_p
        frequency_penalty: 0.0,  // 移除頻率懲罰，讓 AI 更自然
        presence_penalty: 0.0,   // 移除存在懲罰
        stream: true
      })
    })

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      const errorText = await upstreamResponse.text()
      logger.error('OpenRouter API 錯誤', {
        status: upstreamResponse.status,
        errorText
      })
      
      // 檢查是否是認證錯誤
      if (upstreamResponse.status === 401) {
        throw new Error('AI 服務認證失敗，請聯繫系統管理員檢查 API 密鑰')
      }
      
      throw new Error('AI 服務暫時無法回應，請稍後再試或重試')
    }

    let finalText = ''

    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          finalText = sanitizeFinal(await streamOpenRouterResponse(upstreamResponse, controller))

          const suggestions = await generateSuggestions(finalText, message, OPENROUTER_API_URL, OPENROUTER_API_KEY)
          controller.enqueue(`event: suggestions\ndata: ${JSON.stringify(suggestions)}\n\n`)
          controller.enqueue(`event: done\ndata: {"success":true}\n\n`)
          controller.close()
        } catch (error) {
          logger.error('流式處理時發生錯誤', {
            error: error instanceof Error ? error.message : String(error)
          })
          controller.enqueue(`event: error\ndata: {"error":"AI 服務暫時無法回應，請稍後再試"}\n\n`)
          controller.close()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    })
  } catch (error) {
    logger.error('AI 聊天錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'AI 助手暫時無法回應，請稍後再試或重試' },
      { status: 500 }
    )
  }
}