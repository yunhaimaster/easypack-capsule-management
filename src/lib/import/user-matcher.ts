/**
 * User Fuzzy Matcher for Import
 * 
 * Matches user names from imported data to existing users in the database.
 * Uses Levenshtein distance for fuzzy matching with fallback chain.
 */

import { normalizeName, similarity } from '../export/encoding-utils'

/**
 * User record from database
 */
export interface User {
  id: string
  nickname: string | null
  phoneE164: string
}

/**
 * User mapping result
 */
export interface UserMappingResult {
  importedName: string
  matchedUser: User | null
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'none'
  similarityScore?: number
  alternatives?: Array<{ user: User; score: number }>
}

/**
 * Match a single imported name to existing users
 * 
 * Fallback chain:
 * 1. Exact match (after normalization)
 * 2. High similarity (> 0.8)
 * 3. Medium similarity (> 0.6)
 * 4. Low similarity (> 0.4) - show alternatives
 * 5. No match
 * 
 * @param importedName - Name from imported data
 * @param users - Array of existing users
 * @returns Matching result with confidence level
 */
export function matchUser(importedName: string, users: User[]): UserMappingResult {
  if (!importedName || importedName.trim() === '') {
    return {
      importedName,
      matchedUser: null,
      confidence: 'none'
    }
  }
  
  const normalizedName = normalizeName(importedName)
  
  // 1. Exact match (nickname or phone)
  const exactMatch = users.find(user => {
    if (user.nickname && normalizeName(user.nickname) === normalizedName) {
      return true
    }
    if (normalizeName(user.phoneE164) === normalizedName) {
      return true
    }
    return false
  })
  
  if (exactMatch) {
    return {
      importedName,
      matchedUser: exactMatch,
      confidence: 'exact',
      similarityScore: 1.0
    }
  }
  
  // 2. Fuzzy match with similarity scores
  const matches = users.map(user => {
    const nicknameScore = user.nickname ? similarity(normalizedName, normalizeName(user.nickname)) : 0
    const phoneScore = similarity(normalizedName, normalizeName(user.phoneE164))
    const maxScore = Math.max(nicknameScore, phoneScore)
    
    return {
      user,
      score: maxScore
    }
  }).sort((a, b) => b.score - a.score)
  
  const bestMatch = matches[0]
  
  // High confidence (> 0.8)
  if (bestMatch && bestMatch.score > 0.8) {
    return {
      importedName,
      matchedUser: bestMatch.user,
      confidence: 'high',
      similarityScore: bestMatch.score,
      alternatives: matches.slice(1, 4) // Show top 3 alternatives
    }
  }
  
  // Medium confidence (> 0.6)
  if (bestMatch && bestMatch.score > 0.6) {
    return {
      importedName,
      matchedUser: bestMatch.user,
      confidence: 'medium',
      similarityScore: bestMatch.score,
      alternatives: matches.slice(1, 4)
    }
  }
  
  // Low confidence (> 0.4) - don't auto-match, show alternatives
  if (bestMatch && bestMatch.score > 0.4) {
    return {
      importedName,
      matchedUser: null,
      confidence: 'low',
      similarityScore: bestMatch.score,
      alternatives: matches.slice(0, 5) // Show top 5 alternatives
    }
  }
  
  // No match
  return {
    importedName,
    matchedUser: null,
    confidence: 'none',
    similarityScore: bestMatch?.score || 0,
    alternatives: matches.length > 0 ? matches.slice(0, 5) : []
  }
}

/**
 * Batch match multiple imported names
 * 
 * @param importedNames - Array of names from imported data (unique)
 * @param users - Array of existing users
 * @returns Map of imported name to matching result
 */
export function batchMatchUsers(
  importedNames: string[],
  users: User[]
): Map<string, UserMappingResult> {
  const results = new Map<string, UserMappingResult>()
  
  // Remove duplicates and empty values
  const uniqueNames = Array.from(new Set(importedNames.filter(name => name && name.trim())))
  
  uniqueNames.forEach(name => {
    const result = matchUser(name, users)
    results.set(name, result)
  })
  
  return results
}

/**
 * Get summary statistics for batch matching
 */
export function getMatchingStats(results: Map<string, UserMappingResult>): {
  total: number
  exact: number
  high: number
  medium: number
  low: number
  none: number
} {
  const stats = {
    total: results.size,
    exact: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0
  }
  
  results.forEach(result => {
    switch (result.confidence) {
      case 'exact':
        stats.exact++
        break
      case 'high':
        stats.high++
        break
      case 'medium':
        stats.medium++
        break
      case 'low':
        stats.low++
        break
      case 'none':
        stats.none++
        break
    }
  })
  
  return stats
}

/**
 * Check if matching results are acceptable for import
 * 
 * Acceptable if:
 * - No low/none confidence matches, OR
 * - User has manually resolved all ambiguous matches
 */
export function isMatchingAcceptable(
  results: Map<string, UserMappingResult>,
  manualMappings?: Map<string, string>
): boolean {
  let hasUnresolved = false
  
  results.forEach((result, importedName) => {
    // If low/none confidence and no manual mapping, it's unresolved
    if ((result.confidence === 'low' || result.confidence === 'none') && result.matchedUser === null) {
      if (!manualMappings || !manualMappings.has(importedName)) {
        hasUnresolved = true
      }
    }
  })
  
  return !hasUnresolved
}

