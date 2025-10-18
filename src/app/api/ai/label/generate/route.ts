import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LabelGenerationRequest, LabelConcept, LabelTemplate } from '@/types/label'
import { buildMultiConceptPrompt } from '@/lib/ai/label-prompts'
import { validateHK, applyHKDefaults } from '@/lib/hk-label-compliance'
import { renderLabelToSVG } from '@/lib/label-renderer'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'

// Models for parallel generation - use same models as recipe-generate and granulation
const MODELS = [
  { id: 'deepseek/deepseek-chat-v3.1', name: 'DeepSeek Chat v3.1' },
  { id: 'openai/gpt-4.1-mini', name: 'OpenAI GPT-4.1 Mini' },
  { id: 'x-ai/grok-4-fast', name: 'xAI Grok 4 Fast' }
]

const requestSchema = z.object({
  formula: z.object({
    productName: z.string(),
    ingredients: z.array(z.object({
      materialName: z.string(),
      unitContentMg: z.number()
    })),
    targetAudience: z.string().optional(),
    claims: z.array(z.string()).optional()
  }),
  constraints: z.object({
    sizeMm: z.object({
      width: z.number(),
      height: z.number()
    }).optional(),
    palette: z.array(z.string()).optional(),
    style: z.enum(['modern', 'classic', 'minimal', 'bold']).optional(),
    bilingual: z.boolean().optional()
  }).optional(),
  orderId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI 服務暫時無法使用，請稍後再試' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const validatedRequest = requestSchema.parse(body) as LabelGenerationRequest

    const prompt = buildMultiConceptPrompt(validatedRequest, 3)

    logger.info('Generating label concepts', {
      productName: validatedRequest.formula.productName,
      ingredientCount: validatedRequest.formula.ingredients.length
    })

    // Call models in parallel
    const modelPromises = MODELS.map(model => 
      generateWithModel(model.id, model.name, prompt, OPENROUTER_API_KEY)
    )

    const results = await Promise.allSettled(modelPromises)
    
    // Extract successful concepts
    const allConcepts: LabelConcept[] = []
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        allConcepts.push(...result.value)
      } else if (result.status === 'rejected') {
        logger.error(`Model ${MODELS[idx].name} failed`, { error: result.reason })
      }
    })

    if (allConcepts.length === 0) {
      return NextResponse.json(
        { success: false, error: '無法生成設計概念，請稍後再試' },
        { status: 500 }
      )
    }

    // Score and sort concepts
    const scoredConcepts = allConcepts
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Top 5

    logger.info('Label concepts generated', {
      total: allConcepts.length,
      returned: scoredConcepts.length
    })

    return NextResponse.json({
      success: true,
      data: {
        concepts: scoredConcepts,
        guide: '請選擇一個設計概念進行微調，或匯出為 SVG/PDF 格式'
      }
    })

  } catch (error) {
    logger.error('Label generation error', {
      error: error instanceof Error ? error.message : String(error)
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '請求格式錯誤', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: '生成標籤設計失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

async function generateWithModel(
  modelId: string,
  modelName: string,
  prompt: string,
  apiKey: string
): Promise<LabelConcept[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Easy Health Label Designer'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: '你是專業的保健品標籤設計 AI。輸出必須是有效的 JSON 格式，不要包含任何註釋或額外文字。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error(`${modelName} API error`, { 
        status: response.status, 
        error: errorData 
      })
      throw new Error(`${modelName} API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    if (!content) {
      logger.error(`${modelName} returned empty content`, { data })
      throw new Error(`${modelName} returned empty response`)
    }

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
    const jsonText = jsonMatch[1].trim()

    // Parse response
    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch (parseError) {
      logger.error(`${modelName} JSON parse error`, { 
        jsonText: jsonText.substring(0, 500),
        parseError 
      })
      // Try to repair common JSON issues
      try {
        const repaired = repairJSON(jsonText)
        parsed = JSON.parse(repaired)
      } catch (repairError) {
        logger.error(`${modelName} JSON repair failed`, { repairError })
        throw new Error(`${modelName} returned invalid JSON`)
      }
    }

    // Handle different response formats
    let templates: LabelTemplate[] = []
    if (parsed.concepts && Array.isArray(parsed.concepts)) {
      // Multi-concept format
      templates = parsed.concepts.map((c: any) => c.template).filter(Boolean)
    } else if (parsed.template) {
      // Single concept format
      templates = [parsed.template]
    } else if (parsed.id && parsed.elements) {
      // Direct template format
      templates = [parsed]
    }

    // Convert to LabelConcept with compliance checking
    const concepts: LabelConcept[] = []
    for (const template of templates) {
      try {
        // Apply HK defaults
        const enhancedTemplate = applyHKDefaults(template, {
          productName: template.name,
          madeInHK: true
        })

        // Validate compliance
        const compliance = validateHK(enhancedTemplate)

        // Generate preview SVG
        const svgPreview = renderLabelToSVG(enhancedTemplate, {
          showBleed: true,
          showSafe: true
        })

        // Calculate score
        const score = calculateConceptScore(enhancedTemplate, compliance)

        // Extract palette and typography from elements
        const colors = new Set<string>()
        const fonts = new Set<string>()
        enhancedTemplate.elements.forEach(el => {
          if (el.kind === 'text') {
            colors.add(el.color)
            fonts.add(el.font.family)
          }
          if (el.kind === 'shape' && el.fill) {
            colors.add(el.fill)
          }
        })

        concepts.push({
          template: {
            ...enhancedTemplate,
            metadata: {
              ...enhancedTemplate.metadata,
              generatedBy: modelName
            }
          },
          svgPreview,
          compliance: {
            passed: compliance.passed,
            checklist: compliance.checklist
          },
          score,
          palette: Array.from(colors).slice(0, 5),
          typography: {
            primary: Array.from(fonts)[0] || 'Noto Sans TC',
            secondary: Array.from(fonts)[1] || 'Arial'
          }
        })
      } catch (conceptError) {
        logger.error(`Failed to process template from ${modelName}`, { conceptError })
      }
    }

    return concepts

  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

function repairJSON(jsonText: string): string {
  // Remove trailing commas
  let repaired = jsonText.replace(/,(\s*[}\]])/g, '$1')
  
  // Remove comments
  repaired = repaired.replace(/\/\/[^\n]*/g, '')
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '')
  
  return repaired
}

function calculateConceptScore(template: LabelTemplate, compliance: any): number {
  let score = compliance.score // Base score from compliance (0-100)

  // Bonus for element count (good coverage)
  const elementCount = template.elements.length
  if (elementCount >= 8 && elementCount <= 15) {
    score += 5 // Optimal range
  } else if (elementCount > 15) {
    score -= 5 // Too crowded
  }

  // Bonus for safe zone adherence
  const { widthMm, heightMm, safeMm = 3 } = template.size
  const violations = template.elements.filter(el => {
    return el.x < safeMm || el.y < safeMm || 
           el.x > widthMm - safeMm || el.y > heightMm - safeMm
  }).length
  
  if (violations > 0) {
    score -= violations * 3
  }

  // Cap at 100
  return Math.min(100, Math.max(0, score))
}

