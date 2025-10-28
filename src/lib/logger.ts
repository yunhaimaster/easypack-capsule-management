type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const redactedValue = '[REDACTED]'

const sensitiveKeyPatterns = [
  /password/i,
  /passcode/i,
  /secret/i,
  /token/i,
  /key/i,
  /credential/i,
  /auth/i,
  /header/i,
  /cookie/i,
  /body/i,
  /payload/i,
  /data/i
]

interface LogMetadata {
  [key: string]: unknown
}

const includeStackTrace = process.env.NODE_ENV !== 'production'

function isSensitiveKey(key: string) {
  return sensitiveKeyPatterns.some((pattern) => pattern.test(key))
}

function sanitizeValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > 4) {
    return Array.isArray(value) ? '[Array]' : typeof value === 'object' ? '[Object]' : value
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(includeStackTrace && value.stack ? { stack: value.stack } : {})
    }
  }

  if (typeof value === 'function') {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1, seen))
  }

  if (value && typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]'
    }

    seen.add(value)

    const sanitized: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = isSensitiveKey(key) ? redactedValue : sanitizeValue(nested, depth + 1, seen)
    }

    seen.delete(value)
    return sanitized
  }

  return value
}

function sanitizeMetadata(metadata?: LogMetadata) {
  if (!metadata) return undefined
  const seen = new WeakSet<object>()
  return sanitizeValue(metadata, 0, seen) as LogMetadata | undefined
}

function emit(level: LogLevel, message: string, metadata?: LogMetadata) {
  const logEntry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
  }

  const sanitizedMetadata = sanitizeMetadata(metadata)
  if (sanitizedMetadata && Object.keys(sanitizedMetadata).length > 0) {
    logEntry.metadata = sanitizedMetadata
  }

  const output = JSON.stringify(logEntry)
  
  // Check if we're in a browser environment (client-side)
  const isBrowser = typeof window !== 'undefined'

  switch (level) {
    case 'debug':
    case 'info':
      if (process.env.NODE_ENV !== 'production') {
        if (isBrowser) {
          console.log(output)
        } else {
          process.stdout.write(`${output}\n`)
        }
      }
      break
    case 'warn':
      if (isBrowser) {
        console.warn(output)
      } else {
        process.stderr.write(`${output}\n`)
      }
      break
    case 'error':
      if (isBrowser) {
        console.error(output)
      } else {
        process.stderr.write(`${output}\n`)
      }
      break
    default:
      if (process.env.NODE_ENV !== 'production') {
        if (isBrowser) {
          console.log(output)
        } else {
          process.stdout.write(`${output}\n`)
        }
      }
  }
}

export const logger = {
  debug(message: string, metadata?: LogMetadata) {
    emit('debug', message, metadata)
  },
  info(message: string, metadata?: LogMetadata) {
    emit('info', message, metadata)
  },
  warn(message: string, metadata?: LogMetadata) {
    emit('warn', message, metadata)
  },
  error(message: string, metadata?: LogMetadata) {
    emit('error', message, metadata)
  }
}


