/**
 * API validation utilities
 * Functions for validating inputs, sanitizing data, and checking API keys
 */

import { IngredientInput, ValidationResult, ApiKeyValidation } from '@/types/api'

/**
 * Validates and sanitizes ingredient input array
 * @param ingredients - Raw ingredients data (unknown type)
 * @returns ValidationResult with cleaned IngredientInput array or error
 * @example
 * const result = validateIngredients([{ materialName: 'Vitamin C', unitContentMg: 500 }])
 * if (result.valid) { console.log(result.data) } // Cleaned ingredients
 */
export function validateIngredients(ingredients: unknown): ValidationResult<IngredientInput[]> {
  if (!Array.isArray(ingredients)) {
    return {
      valid: false,
      error: 'Ingredients must be an array'
    }
  }

  if (ingredients.length === 0) {
    return {
      valid: false,
      error: 'At least one ingredient is required'
    }
  }

  const validIngredients: IngredientInput[] = []
  
  for (const ing of ingredients) {
    if (!ing || typeof ing !== 'object') {
      return {
        valid: false,
        error: 'Each ingredient must be an object'
      }
    }

    const { materialName, unitContentMg } = ing as any

    if (!materialName || typeof materialName !== 'string' || materialName.trim() === '') {
      return {
        valid: false,
        error: 'Each ingredient must have a valid materialName'
      }
    }

    const content = Number(unitContentMg)
    if (isNaN(content) || content <= 0) {
      return {
        valid: false,
        error: 'Each ingredient must have a positive unitContentMg value'
      }
    }

    validIngredients.push({
      materialName: String(materialName).trim(),
      unitContentMg: content
    })
  }

  return {
    valid: true,
    data: validIngredients
  }
}

/**
 * Sanitizes general string input (trim, basic cleaning)
 * @param input - Raw string input
 * @returns Sanitized string
 * @example
 * const clean = sanitizeInput('  Hello World  \n')
 * // Returns: "Hello World"
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with spaces
}

/**
 * Validates OpenRouter API key
 * @param key - API key string (can be undefined)
 * @returns ApiKeyValidation result
 * @example
 * const validation = validateApiKey(process.env.OPENROUTER_API_KEY)
 * if (!validation.valid) { console.error(validation.error) }
 */
export function validateApiKey(key: string | undefined): ApiKeyValidation {
  if (!key) {
    return {
      valid: false,
      error: 'OpenRouter API key is required'
    }
  }

  if (typeof key !== 'string' || key.trim() === '') {
    return {
      valid: false,
      error: 'OpenRouter API key must be a non-empty string'
    }
  }

  return {
    valid: true
  }
}

/**
 * Validates that a string is not empty after trimming
 * @param value - String to validate
 * @param fieldName - Name of the field for error messages
 * @returns ValidationResult with sanitized string or error
 * @example
 * const result = validateNonEmptyString('  ', 'message')
 * if (!result.valid) { console.log(result.error) } // "message cannot be empty"
 */
export function validateNonEmptyString(
  value: unknown, 
  fieldName: string
): ValidationResult<string> {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `${fieldName} must be a string`
    }
  }

  const trimmed = value.trim()
  if (trimmed === '') {
    return {
      valid: false,
      error: `${fieldName} cannot be empty`
    }
  }

  return {
    valid: true,
    data: trimmed
  }
}
