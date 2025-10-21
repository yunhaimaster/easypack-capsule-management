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
// Reference: https://www.volcengine.com/docs/82379/1541523
function getAspectRatio(width: number, height: number): string {
  const ratio = width / height
  
  // For square or near-square images, use 1:1
  if (ratio >= 0.9 && ratio <= 1.1) return '1:1'
  
  // For portrait
  if (ratio < 0.9) {
    // 3:4 ratio (poster: 3520x4704 = 0.748...)
    if (ratio >= 0.7 && ratio <= 0.8) return '3:4'
    // 2:3 ratio
    if (ratio >= 0.6 && ratio <= 0.7) return '2:3'
    // 9:16 ratio
    if (ratio >= 0.55 && ratio <= 0.65) return '9:16'
    return '3:4' // Default portrait
  }
  
  // For landscape
  if (ratio >= 1.4 && ratio <= 1.6) return '3:2'
  if (ratio >= 1.7 && ratio <= 1.8) return '16:9'
  
  return '1:1' // Default to square for packaging images
}

// Map dimension to quality level with actual dimensions
function getQualityLevel(width: number, height: number): string {
  // For poster (3520x4704), return exact dimensions
  if (width === 3520 && height === 4704) {
    return '3520x4704'
  }
  
  const maxDimension = Math.max(width, height)
  if (maxDimension <= 1024) return '1024x1024'
  if (maxDimension <= 2048) return '2048x2048'
  
  // For 4K images, return the requested dimensions
  return `${width}x${height}`
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 2048, height = 2048, seed } = await request.json()

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

    // Calculate aspect ratio and quality based on requested dimensions
    const aspectRatio = getAspectRatio(width, height)
    const quality = getQualityLevel(width, height)

    // Enhance prompt with text quality instructions
    const enhancedPrompt = `${prompt.trim()}

CRITICAL TEXT RENDERING REQUIREMENTS:
- All Chinese text must be sharp, clear, and highly legible
- Text should have high contrast against background
- Font rendering must be crisp with no blur or artifacts
- Product name characters must be perfectly formed
- Label text should be in focus and readable at all sizes`

    // Build Doubao SeeDream 4.0 API request
    // Reference: https://www.volcengine.com/docs/82379/1541523
    const payload = {
      model: MODEL_ID,
      prompt: enhancedPrompt,
      aspect_ratio: aspectRatio, // Force 1:1 for packaging images
      size: quality, // Force 2K for better text quality
      response_format: 'url',
      seed: seed || Math.floor(Math.random() * 1000000), // Use provided seed or generate random
      num_inference_steps: 50, // Higher steps = better quality (recommended: 20-50)
      watermark: false, // Disable watermark for professional images
      stream: false // Non-streaming for stable quality
    }

    logger.info(`正在使用 Doubao SeeDream 4.0 生成圖像 (${quality})`, {
      model: MODEL_ID,
      aspectRatio,
      size: quality,
      requestedDimensions: `${width}x${height}`,
      promptLength: enhancedPrompt.length,
      inferenceSteps: 50
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
        seed: payload.seed, // Return the seed used for generation
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

