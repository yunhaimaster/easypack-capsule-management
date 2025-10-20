/**
 * Server-Sent Events (SSE) streaming utilities
 * Pure functions for handling SSE encoding, parsing, and response creation
 */

import { SSEEvent } from '@/types/api'

/**
 * Creates a TextEncoder instance for SSE streaming
 * @returns TextEncoder instance
 */
export function createSSEEncoder(): TextEncoder {
  return new TextEncoder()
}

/**
 * Creates a Server-Sent Events formatted string
 * @param event - Event type (start, delta, done, error, etc.)
 * @param data - Event payload as JSON-serializable object
 * @returns SSE formatted string ready for streaming
 * @example
 * createSSEEvent('delta', { modelId: 'gpt-4', delta: 'Hello' })
 * // Returns: "event: delta\ndata: {\"modelId\":\"gpt-4\",\"delta\":\"Hello\"}\n\n"
 */
export function createSSEEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

/**
 * Parses a stream buffer into SSE events and remaining buffer
 * @param buffer - Raw stream buffer string
 * @returns Object with parsed events array and remaining buffer
 * @example
 * const { events, remaining } = parseStreamBuffer("event: delta\ndata: {\"content\":\"Hello\"}\n\npartial")
 * // events: ["event: delta\ndata: {\"content\":\"Hello\"}\n\n"]
 * // remaining: "partial"
 */
export function parseStreamBuffer(buffer: string): { events: string[], remaining: string } {
  const events: string[] = []
  let remaining = buffer
  
  let eventBoundary = remaining.indexOf('\n\n')
  while (eventBoundary !== -1) {
    const event = remaining.slice(0, eventBoundary)
    events.push(event)
    remaining = remaining.slice(eventBoundary + 2)
    eventBoundary = remaining.indexOf('\n\n')
  }
  
  return { events, remaining }
}

/**
 * Creates a standard SSE Response with proper headers
 * @param stream - ReadableStream for SSE data
 * @param headers - Additional headers to include
 * @returns Response object configured for SSE streaming
 * @example
 * const response = createStreamResponse(stream, { 'Custom-Header': 'value' })
 */
export function createStreamResponse(
  stream: ReadableStream, 
  headers: Record<string, string> = {}
): Response {
  const defaultHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  }
  
  return new Response(stream, {
    headers: { ...defaultHeaders, ...headers }
  })
}

/**
 * Helper function to send SSE events through a controller
 * @param controller - ReadableStreamDefaultController
 * @param encoder - TextEncoder instance
 * @param event - Event type
 * @param data - Event data
 */
export function sendSSEEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: unknown
): void {
  const eventString = createSSEEvent(event, data)
  controller.enqueue(encoder.encode(eventString))
}
