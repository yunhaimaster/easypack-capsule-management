import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const MODEL_ID = 'doubao-seedream-4-0-250828'
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'

// Get API key from environment variable (fallback to hardcoded for backwards compatibility)
const getDoubaoApiKey = () => {
  return process.env.DOUBAO_API_KEY || '469fb1c5-8cd2-4c80-8375-e5f8ca3d91aa'
}

export const dynamic = 'force-dynamic'

// SeeDream 4.0 supports specific aspect ratios
// For 1:1 (square), we use '1:1' directly
// Reference: https://www.volcengine.com/docs/82379/1541523
function getAspectRatio(width: number, height: number): string {
  const ratio = width / height
  
  // For square or near-square images, use 1:1
  if (ratio >= 0.9 && ratio <= 1.1) return '1:1'
  
  // For portrait
  if (ratio < 0.9) {
    if (ratio >= 0.6 && ratio <= 0.7) return '2:3'
    if (ratio >= 0.55 && ratio <= 0.65) return '9:16'
    return '2:3' // Default portrait
  }
  
  // For landscape
  if (ratio >= 1.4 && ratio <= 1.6) return '3:2'
  if (ratio >= 1.7 && ratio <= 1.8) return '16:9'
  
  return '1:1' // Default to square for packaging images
}

// Map dimension to quality level (1K, 2K, 4K)
function getQualityLevel(width: number, height: number): string {
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

    // Force 1:1 aspect ratio for packaging images (always square)
    const aspectRatio = '1:1'
    const quality = getQualityLevel(width, height)

    // Build Doubao SeeDream 4.0 API request
    // Reference: https://www.volcengine.com/docs/82379/1541523
    const payload = {
      model: MODEL_ID,
      prompt: prompt.trim(),
      aspect_ratio: aspectRatio, // Force 1:1 for packaging images
      size: quality, // Quality level: 1K, 2K, or 4K
      response_format: 'url',
      seed: Math.floor(Math.random() * 1000000), // Random seed for variation
      num_inference_steps: 50, // Higher steps = better quality (default: 20-50)
      guidance_scale: 7.5, // Creative vs accurate (default: 7-8)
      watermark: false, // Disable watermark for professional images
      stream: false
    }

    logger.info('正在使用 Doubao SeeDream 4.0 生成圖像', {
      model: MODEL_ID,
      aspectRatio,
      quality,
      promptLength: prompt.length,
      inferenceSteps: 50,
      guidanceScale: 7.5
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

