import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { recipeId } = await request.json()
    
    // Get user context for audit logging
    const context = await getUserContextFromRequest(request)
    
    const recipe = await prisma.recipeLibrary.findUnique({
      where: { id: recipeId },
      select: { id: true, recipeName: true }
    })
    
    if (!recipe) {
      return NextResponse.json({
        success: false,
        error: '配方不存在'
      }, { status: 404 })
    }

    // Log recipe export (audit only, PDF generated on client)
    await logAudit({
      action: AuditAction.RECIPE_EXPORTED,
      userId: context.userId,
      phone: context.phone,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: {
        recipeId: recipe.id,
        recipeName: recipe.recipeName,
        format: 'pdf'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: '導出記錄已保存'
    })
  } catch (error) {
    console.error('Export PDF audit log error:', error)
    return NextResponse.json({
      success: false,
      error: '記錄失敗'
    }, { status: 500 })
  }
}

