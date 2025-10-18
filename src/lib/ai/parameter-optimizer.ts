/**
 * AI Model Parameter Optimizer
 * Dynamically optimizes parameters based on task type and complexity
 */

export interface TaskConfig {
  type: 'creative' | 'analytical' | 'consensus' | 'interactive'
  complexity: 'low' | 'medium' | 'high'
  maxTokens?: number
  customParams?: Record<string, any>
}

export interface OptimizedParams {
  temperature: number
  top_p: number
  max_tokens: number
  frequency_penalty: number
  presence_penalty: number
  stream: boolean
}

/**
 * Get optimized parameters based on task configuration
 */
export function getOptimizedParams(config: TaskConfig): OptimizedParams {
  const baseParams = getBaseParams(config.type)
  const complexityMultiplier = getComplexityMultiplier(config.complexity)
  
  return {
    temperature: Math.min(2.0, baseParams.temperature * complexityMultiplier),
    top_p: baseParams.top_p,
    max_tokens: config.maxTokens || (baseParams.maxTokens * complexityMultiplier),
    frequency_penalty: baseParams.frequency_penalty,
    presence_penalty: baseParams.presence_penalty,
    stream: true,
    ...config.customParams
  }
}

/**
 * Base parameters for different task types
 */
function getBaseParams(taskType: TaskConfig['type']) {
  switch (taskType) {
    case 'creative':
      return {
        temperature: 0.7,
        top_p: 0.9,
        maxTokens: 6000,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }
    
    case 'analytical':
      return {
        temperature: 0.3,
        top_p: 0.9,
        maxTokens: 8000,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      }
    
    case 'consensus':
      return {
        temperature: 0.1,
        top_p: 0.95,
        maxTokens: 4000,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      }
    
    case 'interactive':
      return {
        temperature: 0.5,
        top_p: 0.9,
        maxTokens: 1000,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }
    
    default:
      return {
        temperature: 0.3,
        top_p: 0.9,
        maxTokens: 4000,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      }
  }
}

/**
 * Complexity multiplier for token limits
 */
function getComplexityMultiplier(complexity: TaskConfig['complexity']): number {
  switch (complexity) {
    case 'low':
      return 0.7
    case 'medium':
      return 1.0
    case 'high':
      return 1.5
    default:
      return 1.0
  }
}

/**
 * Task type detection based on content analysis
 */
export function detectTaskType(content: string, context?: string): TaskConfig['type'] {
  const lowerContent = content.toLowerCase()
  const lowerContext = context?.toLowerCase() || ''
  
  // Creative tasks
  if (lowerContent.includes('generate') || 
      lowerContent.includes('create') || 
      lowerContent.includes('design') ||
      lowerContent.includes('marketing') ||
      lowerContent.includes('slogan')) {
    return 'creative'
  }
  
  // Consensus tasks
  if (lowerContent.includes('consensus') || 
      lowerContent.includes('synthesize') || 
      lowerContent.includes('combine') ||
      lowerContent.includes('final') ||
      lowerContext.includes('consensus')) {
    return 'consensus'
  }
  
  // Interactive tasks
  if (lowerContent.includes('suggest') || 
      lowerContent.includes('question') || 
      lowerContent.includes('chat') ||
      lowerContent.includes('help')) {
    return 'interactive'
  }
  
  // Default to analytical
  return 'analytical'
}

/**
 * Complexity detection based on content length and keywords
 */
export function detectComplexity(content: string): TaskConfig['complexity'] {
  const wordCount = content.split(' ').length
  const hasComplexKeywords = /analyze|comprehensive|detailed|complex|multiple|compare|evaluate/i.test(content)
  
  if (wordCount > 100 || hasComplexKeywords) {
    return 'high'
  } else if (wordCount > 50) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * Auto-optimize parameters based on content analysis
 */
export function autoOptimizeParams(content: string, context?: string): OptimizedParams {
  const taskType = detectTaskType(content, context)
  const complexity = detectComplexity(content)
  
  return getOptimizedParams({ type: taskType, complexity })
}

/**
 * Model-specific parameter adjustments
 */
export function adjustForModel(params: OptimizedParams, modelId: string): OptimizedParams {
  const modelAdjustments: Record<string, Partial<OptimizedParams>> = {
    // GPT models - more conservative
    'gpt': {
      temperature: Math.min(params.temperature, 0.8),
      frequency_penalty: Math.max(params.frequency_penalty, 0.0)
    },
    
    // Claude models - can handle higher creativity
    'claude': {
      temperature: Math.min(params.temperature * 1.1, 1.0),
      max_tokens: Math.min(params.max_tokens, 20000)
    },
    
    // Grok models - good for creative tasks
    'grok': {
      temperature: Math.min(params.temperature * 1.2, 1.5),
      top_p: Math.max(params.top_p, 0.95)
    },
    
    // DeepSeek models - optimized for analysis
    'deepseek': {
      temperature: Math.max(params.temperature * 0.9, 0.1),
      frequency_penalty: 0.0
    }
  }
  
  const adjustment = modelAdjustments[Object.keys(modelAdjustments).find(key => 
    modelId.toLowerCase().includes(key)
  ) || 'gpt']
  
  return { ...params, ...adjustment }
}

/**
 * Cost-optimized parameters for budget-conscious usage
 */
export function getCostOptimizedParams(baseParams: OptimizedParams): OptimizedParams {
  return {
    ...baseParams,
    max_tokens: Math.floor(baseParams.max_tokens * 0.8),
    temperature: Math.max(baseParams.temperature * 0.9, 0.1)
  }
}

/**
 * Quality-optimized parameters for premium usage
 */
export function getQualityOptimizedParams(baseParams: OptimizedParams): OptimizedParams {
  return {
    ...baseParams,
    max_tokens: Math.floor(baseParams.max_tokens * 1.2),
    temperature: Math.min(baseParams.temperature * 1.1, 1.0)
  }
}
