import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json({ success: false, error: 'Legacy login is disabled' }, { status: 410 })
}
