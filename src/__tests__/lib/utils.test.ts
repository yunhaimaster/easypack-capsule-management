import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (classname utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500')
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
      expect(result).toContain('bg-blue-500')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('filters out falsy values', () => {
      const result = cn('class1', false, null, undefined, 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).not.toContain('false')
      expect(result).not.toContain('null')
    })

    it('handles Tailwind class conflicts', () => {
      // Later classes should override earlier ones
      const result = cn('p-4', 'p-8')
      expect(result).toContain('p-8')
    })

    it('returns empty string for no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })
})

