import { z, ZodError } from 'zod'

/**
 * Format Zod validation errors for better UX
 * Converts ZodError into a user-friendly error object
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return errors
}

/**
 * Safe parse with error formatting
 * Returns either success data or formatted errors
 */
export function safeParseWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: formatZodErrors(result.error),
  }
}

/**
 * Async validation wrapper with error handling
 * Useful for server-side validation in API routes
 */
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string; errors?: Record<string, string> }> {
  try {
    const validated = await schema.parseAsync(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: '驗證失敗',
        errors: formatZodErrors(error),
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    }
  }
}

/**
 * Create a reusable field validator with custom error messages
 */
export function createFieldValidator<T>(
  validator: z.ZodSchema<T>,
  errorMessages?: {
    required?: string
    invalid?: string
    custom?: Record<string, string>
  }
) {
  return (value: unknown): { valid: true; value: T } | { valid: false; error: string } => {
    const result = validator.safeParse(value)
    
    if (result.success) {
      return { valid: true, value: result.data }
    }
    
    const firstError = result.error.errors[0]
    let errorMessage = firstError.message
    
    // Apply custom error messages
    if (errorMessages) {
      if (firstError.code === 'invalid_type' && errorMessages.required) {
        errorMessage = errorMessages.required
      } else if (errorMessages.custom && errorMessages.custom[firstError.code]) {
        errorMessage = errorMessages.custom[firstError.code]
      } else if (errorMessages.invalid) {
        errorMessage = errorMessages.invalid
      }
    }
    
    return { valid: false, error: errorMessage }
  }
}

/**
 * Validate partial form data (useful for step-by-step forms)
 */
export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown,
  fields: (keyof T)[]
): { success: true; data: Partial<z.infer<z.ZodObject<T>>> } | { success: false; errors: Record<string, string> } {
  // Create a partial schema with only specified fields
  const partialSchema = schema.partial().pick(
    Object.fromEntries(fields.map(field => [field, true])) as any
  )
  
  return safeParseWithErrors(partialSchema, data)
}

/**
 * Batch validate multiple schemas
 * Useful when validating related data structures
 */
export function validateBatch<T extends Record<string, z.ZodSchema>>(
  schemas: T,
  data: Record<keyof T, unknown>
): {
  success: true
  data: { [K in keyof T]: z.infer<T[K]> }
} | {
  success: false
  errors: { [K in keyof T]?: Record<string, string> }
} {
  const results: any = {}
  const errors: any = {}
  let hasErrors = false
  
  for (const [key, schema] of Object.entries(schemas)) {
    const result = safeParseWithErrors(schema, data[key])
    
    if (result.success) {
      results[key] = result.data
    } else {
      errors[key] = result.errors
      hasErrors = true
    }
  }
  
  if (hasErrors) {
    return { success: false, errors }
  }
  
  return { success: true, data: results }
}

/**
 * Debounced validation for real-time form validation
 * Returns a promise that resolves after the debounce delay
 */
export function createDebouncedValidator<T>(
  schema: z.ZodSchema<T>,
  debounceMs = 300
): (value: unknown) => Promise<{ valid: boolean; error?: string; data?: T }> {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (value: unknown) => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        const result = schema.safeParse(value)
        
        if (result.success) {
          resolve({ valid: true, data: result.data })
        } else {
          resolve({
            valid: false,
            error: result.error.errors[0]?.message || '驗證失敗',
          })
        }
      }, debounceMs)
    })
  }
}

/**
 * Transform validation errors into React Hook Form compatible format
 */
export function zodErrorToRHF(error: ZodError): Array<{
  name: string
  type: string
  message: string
}> {
  return error.errors.map((err) => ({
    name: err.path.join('.'),
    type: err.code,
    message: err.message,
  }))
}

/**
 * Validate file uploads with custom rules
 */
export function createFileValidator(options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  required?: boolean
}) {
  return z
    .instanceof(File)
    .refine(
      (file) => {
        if (options.required && !file) return false
        if (!options.maxSize) return true
        return file.size <= options.maxSize
      },
      {
        message: `檔案大小不能超過 ${options.maxSize ? (options.maxSize / 1024 / 1024).toFixed(2) : 0} MB`,
      }
    )
    .refine(
      (file) => {
        if (!options.allowedTypes || options.allowedTypes.length === 0) return true
        return options.allowedTypes.includes(file.type)
      },
      {
        message: `只允許上傳 ${options.allowedTypes?.join(', ')} 類型的檔案`,
      }
    )
}

