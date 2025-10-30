import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { getImpersonationState } from '@/lib/auth/impersonation'
import { Role } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Returns current user info if authenticated
export async function GET(request: NextRequest) {
  try {
    // Get session (handles impersonation automatically)
    const session = await getSessionFromCookie()
    
    if (!session) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    const user = session.user

    // Get impersonation state for additional context
    const impersonationState = await getImpersonationState()

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        phone: user.phoneE164,
        role: user.role,
        isAdmin: user.role === Role.ADMIN,
        isManager: user.role === Role.MANAGER || user.role === Role.ADMIN,
        nickname: user.nickname
      },
      impersonation: impersonationState?.isImpersonating ? {
        isImpersonating: true,
        originalUserId: impersonationState.originalUserId,
        impersonatedUserId: impersonationState.impersonatedUserId
      } : {
        isImpersonating: false
      }
    })
  } catch (error) {
    console.error('[Auth /me] Error:', error)
    return NextResponse.json({ success: false, authenticated: false }, { status: 500 })
  }
}

