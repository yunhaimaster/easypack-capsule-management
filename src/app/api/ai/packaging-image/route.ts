import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { buildBaseRequest, fetchOpenRouter } from '@/lib/ai/openrouter-utils'
import { validateApiKey } from '@/lib/api/validation'

const MODEL_ID = 'google/gemini-2.5-flash-image'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024 } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '請提供圖像生成 Prompt' },
        { status: 400 }
      )
    }

    // Validate API key
    const apiKeyValidation = validateApiKey(process.env.OPENROUTER_API_KEY)
    if (!apiKeyValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'AI 服務尚未設定，請聯絡管理員' },
        { status: 500 }
      )
    }

    const payload = buildBaseRequest(
      MODEL_ID,
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Generate a professional packaging render. size ${width}x${height}px. Description: ${prompt}`
            }
          ]
        }
      ],
      {
        stream: false,
        modalities: ['image', 'text']
      }
    )

    const response = await fetchOpenRouter(
      payload,
      process.env.OPENROUTER_API_KEY!,
      'https://openrouter.ai/api/v1/chat/completions'
    )


    const data = await response.json()
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

    if (!imageUrl) {
      logger.error('Gemini 沒有回傳圖像', { data })
      return NextResponse.json(
        { success: false, error: '模型沒有回傳圖像資料' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        prompt: prompt.trim(),
        model: MODEL_ID,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    logger.error('包裝圖像生成錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '圖像生成失敗，請稍後再試'
      },
      { status: 500 }
    )
  }
}

