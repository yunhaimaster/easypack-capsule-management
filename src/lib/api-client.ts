export interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

export async function fetchWithTimeout(input: RequestInfo | URL, options: RequestOptions = {}) {
  const { timeoutMs = 30000, signal, ...rest } = options
  const controller = new AbortController()

  if (signal) {
    if (signal.aborted) {
      controller.abort()
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}
