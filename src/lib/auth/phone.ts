import { z } from 'zod'

export const phoneInputSchema = z.string().trim().min(1, '請輸入電話號碼')

const E164_REGEX = /^\+[1-9]\d{1,14}$/

export function normalizeHongKongDefault(input: string): string {
  const trimmed = input.trim()
  if (trimmed.startsWith('+')) {
    if (!E164_REGEX.test(trimmed)) throw new Error('電話號碼格式不正確')
    return trimmed
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 8) {
    return `+852${digits}`
  }
  throw new Error('請輸入 8 位香港電話或帶國碼的電話號碼')
}


