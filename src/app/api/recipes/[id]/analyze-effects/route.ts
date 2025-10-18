import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/recipes/[id]/analyze-effects
 * AI 分析配方功效
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. 查詢配方及其原料
    const recipe = await prisma.recipeLibrary.findUnique({
      where: { id },
      select: {
        id: true,
        recipeName: true,
        description: true,
        customerName: true,
        productName: true,
        ingredients: true,
        notes: true,
        lastProductionAt: true
      }
    })

    if (!recipe) {
      return NextResponse.json({
        success: false,
        error: '配方不存在'
      }, { status: 404 })
    }

    // 2. 解析原料清單
    let ingredients: Array<{ materialName: string; unitContentMg: number }>
    try {
      ingredients = JSON.parse(recipe.ingredients)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: '原料資料格式錯誤'
      }, { status: 400 })
    }

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json({
        success: false,
        error: '配方沒有原料資料'
      }, { status: 400 })
    }

    // 3. 構建 AI 分析 prompt
    const ingredientList = ingredients
      .map(ing => `- ${ing.materialName}：${ing.unitContentMg}mg`)
      .join('\n')

    const contextParts: string[] = []
    contextParts.push(`配方名稱：${recipe.recipeName}`)
    if (recipe.customerName) {
      contextParts.push(`客戶：${recipe.customerName}`)
    }
    if (recipe.productName) {
      contextParts.push(`產品：${recipe.productName}`)
    }
    if (recipe.description) {
      contextParts.push(`描述：${recipe.description}`)
    }
    if (recipe.notes) {
      contextParts.push(`製程備註：${recipe.notes}`)
    }
    if (recipe.lastProductionAt) {
      contextParts.push(`最後生產日期：${new Date(recipe.lastProductionAt).toLocaleDateString('zh-HK')}`)
    }

  const fallbackMessage = '資料不足，無法分析功效'

  const prompt = `你是一位熟悉保健品的專業營養師。下面僅提供配方的原料清單，請只根據原料本身的已知功效，推論此配方可能帶來的 3 至 5 個核心功效。請使用繁體中文回答，並以「功效1、功效2、功效3」的格式輸出。

如果原料資訊不足以推論任何功效，請直接回答「${fallbackMessage}」。

原料清單：
${ingredientList}

請只回傳功效列表，不要加入其他說明。`

    // 4. 調用 DeepSeek API
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI API 未配置'
      }, { status: 500 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 秒超時

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://capsuledb.easyhealth.internal',
          'X-Title': 'Easy Health Recipe Analyzer'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3.1',
          messages: [
            {
              role: 'system',
              content: '你是一位保健營養專家，僅根據提供的原料資訊推論功效，不能使用其他來源。若資訊不足請回覆「資料不足，無法分析功效」。請以繁體中文回答，並以頓號分隔功效。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `AI API 請求失敗: ${response.status}`)
      }

      const data = await response.json()
      const effects = data.choices?.[0]?.message?.content?.trim()

      if (!effects) {
        throw new Error('AI 未返回分析結果')
      }

      // 5. 儲存分析結果
      // eslint-disable-next-line no-console
      console.log('[AI Analysis] Saving effects for recipe:', id)
      // eslint-disable-next-line no-console
      console.log('[AI Analysis] Effects:', effects)
      
      const updatedRecipe = await prisma.recipeLibrary.update({
        where: { id },
        data: {
          aiEffectsAnalysis: effects,
          aiAnalyzedAt: new Date()
        }
      })

      // eslint-disable-next-line no-console
      console.log('[AI Analysis] Saved successfully:', {
        id: updatedRecipe.id,
        effects: updatedRecipe.aiEffectsAnalysis,
        analyzedAt: updatedRecipe.aiAnalyzedAt
      })

      return NextResponse.json({
        success: true,
        data: {
          effects: effects,
          analyzedAt: updatedRecipe.aiAnalyzedAt
        }
      })

    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('[AI Analysis] Fetch error:', fetchError)
      
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return NextResponse.json({
            success: false,
            error: 'AI 分析超時，請稍後重試'
          }, { status: 408 })
        }
        
        return NextResponse.json({
          success: false,
          error: `AI 分析失敗: ${fetchError.message}`
        }, { status: 500 })
      }

      throw fetchError
    }

  } catch (error) {
    console.error('[AI Analysis] General error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'AI 分析失敗'
    }, { status: 500 })
  }
}

