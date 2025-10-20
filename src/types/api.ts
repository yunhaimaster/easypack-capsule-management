/**
 * API and AI-related type definitions
 * Centralized types for OpenRouter integration and SSE streaming
 */

// AI Types
export interface IngredientInput {
  materialName: string
  unitContentMg: number
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: { url: string }
  }>
}

export interface OpenRouterDelta {
  content?: string
  reasoning?: string
}

export interface OpenRouterChoice {
  delta: OpenRouterDelta
  finish_reason?: string
}

export interface OpenRouterResponse {
  choices: OpenRouterChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface SSEEvent {
  event: 'start' | 'delta' | 'done' | 'error' | 'close' | 'reasoning' | 'suggestions'
  data: Record<string, unknown>
}

export interface ModelConfig {
  id: string
  name: string
}

export interface OpenRouterRequestOptions {
  max_tokens?: number
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  stream?: boolean
  reasoning?: {
    effort: 'low' | 'medium' | 'high'
  }
}

export interface ValidationResult<T> {
  valid: boolean
  data?: T
  error?: string
}

export interface ApiKeyValidation {
  valid: boolean
  error?: string
}

// Order-related types
export interface CleanOrderData {
  customerName: string
  productName: string
  productionQuantity: number
  unitWeightMg: number
  batchTotalWeightMg: number
  capsuleColor: string
  capsuleSize: string
  capsuleType: string
  completionDate: string | null
  processIssues: string | null
  qualityNotes: string | null
  customerService: string | null
  notes: string | null
  productionStatus: string
  createdAt: string
  updatedAt: string
}

export interface OrderIngredient {
  materialName: string
  unitContentMg: number
}

export interface OrderWithIngredients extends CleanOrderData {
  ingredients: OrderIngredient[]
}
