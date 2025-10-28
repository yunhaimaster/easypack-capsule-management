import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { ingredients, recipeId } = await request.json()
    
    console.log('[analyze-interactions] Request received:', {
      recipeId,
      ingredientCount: ingredients?.length || 0
    })
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    if (!OPENROUTER_API_KEY) {
      console.error('[analyze-interactions] OpenRouter API key not configured')
      return NextResponse.json({
        success: false,
        error: 'AI 服務暫時無法使用'
      }, { status: 500 })
    }

    const ingredientList = ingredients
      .map((ing: any) => `${ing.materialName} (${ing.unitContentMg}mg)`)
      .join('\n')

    // Create AbortController for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://capsuledb.easyhealth.internal',
        'X-Title': 'Easy Health Interaction Analyzer'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.1-terminus',
        messages: [
          {
            role: 'system',
            content: `你是專業的保健品配方專家和藥物相互作用專家。分析以下保健品原料之間的相互作用，基於科學文獻和臨床證據。

重要規則：
1. 只回報實際存在且有科學依據的重要相互作用
2. 不要過度警告或虛構風險
3. 若沒有顯著的相互作用，返回空數組
4. 嚴格按照JSON格式回應

JSON格式：
{
  "warnings": [
    {
      "ingredient1": "原料1名稱",
      "ingredient2": "原料2名稱",
      "severity": "high|medium|low",
      "warning": "相互作用的具體說明（基於科學證據）",
      "recommendation": "專業的處理建議"
    }
  ]
}

風險等級標準：
- high: 可能導致嚴重健康問題或顯著降低療效
- medium: 可能影響療效或引起輕微不適
- low: 理論上可能存在但臨床意義不大

請使用繁體中文（香港）回應。`
          },
          {
            role: 'user',
            content: `請分析以下保健品原料的相互作用：

${ingredientList}

請基於科學文獻和臨床證據，識別任何重要的原料相互作用。如果沒有顯著的相互作用，請返回空數組。`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('[analyze-interactions] OpenRouter response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText
    })

    if (!response.ok) {
      console.error('[analyze-interactions] OpenRouter API error:', response.status)
      throw new Error('AI API 請求失敗')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    console.log('[analyze-interactions] AI response:', {
      hasChoices: !!data.choices,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100)
    })
    
    if (!content) {
      console.error('[analyze-interactions] AI response empty')
      throw new Error('AI 回應為空')
    }
    
    // Parse JSON response
    let result
    try {
      result = JSON.parse(content)
      console.log('[analyze-interactions] Parsed result:', {
        hasWarnings: !!result.warnings,
        warningCount: result.warnings?.length || 0
      })
    } catch (parseError) {
      console.error('[analyze-interactions] JSON parse error:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        content: content.substring(0, 500)
      })
      throw new Error('AI 回應格式錯誤')
    }

    // 🆕 保存相互作用分析到數據庫（失敗不影響響應）
    if (recipeId && result.warnings) {
      try {
        await prisma.recipeLibrary.update({
          where: { id: recipeId },
          data: {
            aiInteractions: JSON.stringify(result.warnings),
            aiInteractionsAt: new Date()
          }
        })
        
        // 審計日誌
        const context = await getUserContextFromRequest(request)
        await logAudit({
          action: AuditAction.RECIPE_UPDATED,
          userId: context.userId,
          phone: context.phone,
          ip: context.ip,
          userAgent: context.userAgent,
          metadata: {
            recipeId,
            analysisType: 'interactions',
            warningCount: result.warnings.length,
            highSeverityCount: result.warnings.filter((w: any) => w.severity === 'high').length
          }
        })
      } catch (saveError) {
        console.error('[analyze-interactions] Failed to save results:', saveError)
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[analyze-interactions] Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
    })
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: '分析超時，請稍後再試'
      }, { status: 408 })
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '分析失敗，請重試'
    }, { status: 500 })
  }
}

