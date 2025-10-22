import { prisma } from '@/lib/prisma'

export async function recordOtpAttempt(phoneE164: string, ip: string | null) {
  await prisma.otpAttempt.create({ data: { phoneE164, ip: ip || undefined } })
}

export async function countRecentAttemptsByPhone(phoneE164: string, windowMs: number) {
  const since = new Date(Date.now() - windowMs)
  return prisma.otpAttempt.count({ where: { phoneE164, createdAt: { gte: since } } })
}

export async function countRecentAttemptsByIp(ip: string, windowMs: number) {
  const since = new Date(Date.now() - windowMs)
  return prisma.otpAttempt.count({ where: { ip, createdAt: { gte: since } } })
}


