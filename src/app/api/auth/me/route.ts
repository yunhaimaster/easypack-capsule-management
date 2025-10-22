import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

// Returns current user info if authenticated
export async function GET(request: NextRequest) {
  try {
    // Read cookie from request headers directly (more reliable)
    const cookieHeader = request.headers.get('cookie')
    console.log('[Auth /me] Cookie header:', cookieHeader ? 'present' : 'missing')
    
    if (!cookieHeader) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    // Parse session cookie manually
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const sessionCookie = cookies.find(c => c.startsWith('session='))
    
    if (!sessionCookie) {
      console.log('[Auth /me] No session cookie found')
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    const token = sessionCookie.split('=')[1]
    console.log('[Auth /me] Session token found:', !!token)

    // Verify JWT
    const { payload } = await jwtVerify(token, getSessionSecret())
    const sessionId = String(payload.sessionId || '')
    
    console.log('[Auth /me] JWT verified, sessionId:', sessionId)

    if (!sessionId) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    // Get session from database
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    })

    console.log('[Auth /me] DB session found:', !!session)

    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    const user = session.user

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        phone: user.phoneE164,
        role: user.role,
        isAdmin: user.role === Role.ADMIN,
        isManager: user.role === Role.MANAGER || user.role === Role.ADMIN,
      }
    })
  } catch (error) {
    console.error('[Auth /me] Error:', error)
    return NextResponse.json({ success: false, authenticated: false }, { status: 500 })
  }
}

