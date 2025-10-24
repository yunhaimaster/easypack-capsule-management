/**
 * OpenRouter API utilities
 * Functions for building requests, handling headers, and making API calls
 */

import { OpenRouterMessage, OpenRouterRequestOptions, ModelConfig } from '@/types/api'

/**
 * Creates standard OpenRouter API headers
 * @param referer - HTTP referer URL (defaults to app URL)
 * @param title - X-Title header value
 * @returns HeadersInit object with standard OpenRouter headers
 * @example
 * const headers = getOpenRouterHeaders('https://myapp.com', 'My AI Feature')
 */
export function getOpenRouterHeaders(
  referer?: string, 
  title?: string
): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': referer || process.env.NEXT_PUBLIC_APP_URL || 'https://easypack-capsule-management.vercel.app',
    'X-Title': title || 'Easy Health AI Assistant'
  }
}

/**
 * Builds a base OpenRouter request payload
 * @param model - Model ID (e.g., 'deepseek/deepseek-v3.1-terminus')
 * @param messages - Array of conversation messages
 * @param options - Optional request parameters
 * @returns Complete request payload object
 * @example
 * const payload = buildBaseRequest('gpt-4', messages, { temperature: 0.7, max_tokens: 1000 })
 */
export function buildBaseRequest(
  model: string,
  messages: OpenRouterMessage[],
  options: Partial<OpenRouterRequestOptions> = {}
): object {
  const basePayload = {
    model,
    messages,
    max_tokens: 8000,
    temperature: 0.3,
    top_p: 0.9,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    stream: true,
    ...options
  }

  // Add reasoning parameter if provided
  if (options.reasoning) {
    return {
      ...basePayload,
      reasoning: options.reasoning
    }
  }

  return basePayload
}

/**
 * Makes a request to OpenRouter API
 * @param payload - Request payload object
 * @param apiKey - OpenRouter API key
 * @param url - OpenRouter API URL (defaults to env var)
 * @returns Promise<Response> from OpenRouter API
 * @example
 * const response = await fetchOpenRouter(payload, apiKey)
 */
export async function fetchOpenRouter(
  payload: object,
  apiKey: string,
  url: string = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
): Promise<Response> {
  const headers = getOpenRouterHeaders()
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  return response
}

/**
 * Creates a standard model catalog for AI routes
 * @returns Array of ModelConfig objects
 * @example
 * const models = getStandardModelCatalog()
 * // Returns: [{ id: 'deepseek/deepseek-v3.1-terminus', name: 'DeepSeek V3.1 Terminus' }, ...]
 */
export function getStandardModelCatalog(): ModelConfig[] {
  return [
    { id: 'deepseek/deepseek-v3.1-terminus', name: 'DeepSeek V3.1 Terminus' },
    { id: 'openai/gpt-4.1-mini', name: 'OpenAI GPT-4.1 Mini' },
    { id: 'x-ai/grok-4-fast', name: 'xAI Grok 4 Fast' }
  ]
}
