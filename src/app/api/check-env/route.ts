import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ 已設置' : '❌ 未設置',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '✅ 已設置' : '❌ 未設置',
      NODE_ENV: process.env.NODE_ENV || '未設置',
      VERCEL: process.env.VERCEL ? '✅ 在 Vercel 環境' : '❌ 不在 Vercel 環境'
    }

    return NextResponse.json({
      success: true,
      message: '環境變量檢查',
      environment: envCheck,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: '環境檢查失敗', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
