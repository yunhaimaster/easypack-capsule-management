import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const MODEL_ID = 'doubao-seedream-4-0-250828'
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'

// Get API key from environment variable (fallback to hardcoded for backwards compatibility)
const getDoubaoApiKey = () => {
  return process.env.DOUBAO_API_KEY || '469fb1c5-8cd2-4c80-8375-e5f8ca3d91aa'
}

export const dynamic = 'force-dynamic'

// Map size to Doubao format
function mapSizeToDoubao(width: number, height: number): string {
  // Doubao supports: 1K, 2K, 4K
  const maxDimension = Math.max(width, height)
  if (maxDimension <= 1024) return '1K'
  if (maxDimension <= 2048) return '2K'
  return '4K'
}

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
    const apiKey = getDoubaoApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI 服務尚未設定，請聯絡管理員' },
        { status: 500 }
      )
    }

    const size = mapSizeToDoubao(width, height)

    // Build Doubao API request
    const payload = {
      model: MODEL_ID,
      prompt: prompt.trim(),
      response_format: 'url',
      size: size,
      stream: false, // We'll use non-streaming for now
      watermark: false // Disable watermark for professional packaging images
    }

    logger.info('正在使用 Doubao SeeDream 生成圖像', {
      model: MODEL_ID,
      size,
      promptLength: prompt.length
    })

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Doubao API 請求失敗', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`API 請求失敗 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    
    // Doubao API response format: { data: [{ url: "..." }] }
    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      logger.error('Doubao 沒有回傳圖像', { data })
      return NextResponse.json(
        { success: false, error: '模型沒有回傳圖像資料' },
        { status: 502 }
      )
    }

    logger.info('Doubao 圖像生成成功', {
      imageUrl: imageUrl.substring(0, 50) + '...'
    })

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

