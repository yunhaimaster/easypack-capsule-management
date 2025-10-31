import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { productionOrderSchema, worklogSchema } from '@/lib/validations'
import { calculateWorkUnits } from '@/lib/worklog'
import { DateTime } from 'luxon'
import { logger } from '@/lib/logger'
import { getSessionFromCookie } from '@/lib/auth/session'
import { logAudit } from '@/lib/audit'
import { getUserContextFromRequest } from '@/lib/audit-context'
import { AuditAction } from '@prisma/client'
import { calculateOrderStatus } from '@/lib/order-status'

// Timing-safe comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user for audit logging
    const session = await getSessionFromCookie()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null
    
    const { id } = await params
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        ingredients: true,
        customerService: {
          select: {
            id: true,
            nickname: true,
            phoneE164: true
          }
        },
        worklogs: {
          orderBy: { workDate: 'asc' }
        },
        // NEW: Include linked work order
        workOrder: {
          select: {
            id: true,
            jobNumber: true,
            customerName: true,
            workType: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Audit log for viewing order
    await logAudit({
      action: AuditAction.ORDER_VIEWED,
      userId: session?.userId || null,
      phone: session?.user?.phoneE164 || null,
      ip,
      userAgent,
      metadata: {
        orderId: order.id,
        customerName: order.customerName,
        productName: order.productName,
      }
    })

    // 確保日期正確序列化
    const serializedOrder = {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      completionDate: order.completionDate ? 
        (order.completionDate instanceof Date ? 
          order.completionDate.toISOString().split('T')[0] : 
          order.completionDate) : null,
      worklogs: order.worklogs.map((log) => ({
        ...log,
        workDate: DateTime.fromJSDate(log.workDate, { zone: 'Asia/Hong_Kong' }).startOf('day').toFormat('yyyy-MM-dd')
      }))
    }

    return NextResponse.json(serializedOrder)
  } catch (error) {
    logger.error('載入訂單錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: '載入訂單失敗' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user for audit logging
    const session = await getSessionFromCookie()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent') || null
    
    const { id } = await params
    const body = await request.json()
    const { verificationPassword, ...orderData } = body
    const validatedData = productionOrderSchema.parse(orderData)
    
    // 檢查訂單是否有密碼鎖且是否修改了客戶指定的原料
    const existingOrder = await prisma.productionOrder.findUnique({
      where: { id },
      select: { 
        lockPassword: true, 
        ingredients: {
          select: {
            materialName: true,
            unitContentMg: true,
            isCustomerProvided: true,
            isCustomerSupplied: true
          }
        }
      }
    })
    
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: '訂單不存在' },
        { status: 404 }
      )
    }
    
    // 檢查是否實際修改了客戶指定的原料
    const hasModifiedProtectedIngredients = (): boolean => {
      if (!existingOrder.lockPassword) {
        return false // 沒有密碼鎖，不需要檢查
      }
      
      // 獲取原訂單中客戶指定的原料
      const originalCustomerIngredients = existingOrder.ingredients.filter(
        ing => ing.isCustomerProvided
      )
      
      // 獲取新數據中客戶指定的原料
      const newCustomerIngredients = validatedData.ingredients.filter(
        ing => ing.isCustomerProvided
      )
      
      // 比較數量
      if (originalCustomerIngredients.length !== newCustomerIngredients.length) {
        return true
      }
      
      // 比較每個原料的內容（不考慮順序，按名稱匹配）
      for (const newIng of newCustomerIngredients) {
        const matchingOriginal = originalCustomerIngredients.find(
          orig => orig.materialName === newIng.materialName
        )
        
        if (!matchingOriginal) {
          return true // 新增了客戶指定原料
        }
        
        // 比較含量和來源
        if (
          matchingOriginal.unitContentMg !== newIng.unitContentMg ||
          matchingOriginal.isCustomerSupplied !== newIng.isCustomerSupplied
        ) {
          return true // 修改了原料內容
        }
      }
      
      return false
    }
    
    // 只有在實際修改了受保護字段時才需要密碼驗證
    if (hasModifiedProtectedIngredients()) {
      if (!verificationPassword) {
        return NextResponse.json(
          { success: false, error: '需要密碼驗證' },
          { status: 403 }
        )
      }
      
      const isValid = timingSafeEqual(
        verificationPassword.trim(), 
        existingOrder.lockPassword!.trim()
      )
      
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: '密碼錯誤' },
          { status: 403 }
        )
      }
    }
    
    // Calculate weights
    const unitWeightMg = validatedData.ingredients.reduce(
      (sum, ingredient) => sum + ingredient.unitContentMg,
      0
    )
    const batchTotalWeightMg = unitWeightMg * validatedData.productionQuantity

    const { worklogs = [], ...orderPayload } = validatedData as typeof validatedData & { worklogs?: any[] }

    const preparedWorklogs = worklogs.map((entry) => {
      const parsed = worklogSchema.parse(entry)
      const { minutes, units } = calculateWorkUnits({
        date: parsed.workDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        headcount: parsed.headcount
      })

      const workDate = DateTime.fromISO(parsed.workDate, { zone: 'Asia/Hong_Kong' })

      return {
        workDate: workDate.toJSDate(),
        headcount: parsed.headcount,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        notes: parsed.notes || null,
        effectiveMinutes: minutes,
        calculatedWorkUnits: units
      }
    })

    // Calculate status BEFORE update using prepared data (optimization: no extra query needed)
    const completionDateValue = orderPayload.completionDate && orderPayload.completionDate !== '' ? new Date(orderPayload.completionDate) : null
    const status = calculateOrderStatus({
      worklogsCount: preparedWorklogs.length,
      completionDate: completionDateValue
    })

    const order = await prisma.productionOrder.update({
      where: { id },
      data: {
        customerName: orderPayload.customerName,
        productName: orderPayload.productName,
        productionQuantity: orderPayload.productionQuantity,
        unitWeightMg,
        batchTotalWeightMg,
        completionDate: completionDateValue,
        status,
        statusUpdatedAt: new Date(),
        processIssues: orderPayload.processIssues,
        qualityNotes: orderPayload.qualityNotes,
        capsuleColor: orderPayload.capsuleColor,
        capsuleSize: orderPayload.capsuleSize,
        capsuleType: orderPayload.capsuleType,
        customerServiceId: orderPayload.customerServiceId === 'UNASSIGNED' ? null : orderPayload.customerServiceId,
        actualProductionQuantity: orderPayload.actualProductionQuantity ?? null,
        materialYieldQuantity: orderPayload.materialYieldQuantity ?? null,
        // 更新原料：先刪除舊的再新增，包含客戶來源標記
        ingredients: {
          deleteMany: {},
          create: validatedData.ingredients.map(ingredient => ({
            materialName: ingredient.materialName,
            unitContentMg: ingredient.unitContentMg,
            isCustomerProvided: ingredient.isCustomerProvided ?? true,
            isCustomerSupplied: ingredient.isCustomerSupplied ?? true
          }))
        },
        worklogs: {
          deleteMany: {},
          create: preparedWorklogs
        }
      },
      include: {
        ingredients: true,
        customerService: {
          select: {
            id: true,
            nickname: true,
            phoneE164: true
          }
        },
        worklogs: {
          orderBy: { workDate: 'asc' }
        }
      }
    })

    // Audit log for updating order
    await logAudit({
      action: AuditAction.ORDER_UPDATED,
      userId: session?.userId || null,
      phone: session?.user?.phoneE164 || null,
      ip,
      userAgent,
      metadata: {
        orderId: order.id,
        customerName: order.customerName,
        productName: order.productName,
        quantity: order.productionQuantity,
        ingredientCount: order.ingredients.length,
        worklogCount: order.worklogs.length,
      }
    })

    // 確保日期正確序列化
    const serializedOrder = {
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      completionDate: order.completionDate ? 
        (order.completionDate instanceof Date ? 
          order.completionDate.toISOString().split('T')[0] : 
          order.completionDate) : null
    }

    return NextResponse.json(serializedOrder)
  } catch (error) {
    logger.error('更新訂單錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: '驗證失敗', message: error.message, details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '更新訂單失敗', message: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get order details before deletion for audit log
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      select: {
        customerName: true,
        productName: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: '訂單不存在' },
        { status: 404 }
      )
    }

    // Get user context for audit logging
    const context = await getUserContextFromRequest(request)

    // Delete the order
    await prisma.productionOrder.delete({
      where: { id }
    })

    // Log order deletion
    await logAudit({
      action: AuditAction.ORDER_DELETED,
      userId: context.userId,
      phone: context.phone,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: {
        orderId: id,
        customerName: order.customerName,
        productName: order.productName
      }
    })

    return NextResponse.json({ success: true, message: '訂單刪除成功' })
  } catch (error) {
    logger.error('刪除訂單錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { success: false, error: '刪除訂單失敗' },
      { status: 500 }
    )
  }
}
