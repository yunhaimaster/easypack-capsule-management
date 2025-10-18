import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { productionOrderSchema, worklogSchema } from '@/lib/validations'
import { calculateWorkUnits } from '@/lib/worklog'
import { DateTime } from 'luxon'
import { logger } from '@/lib/logger'

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
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: params.id },
      include: {
        ingredients: true,
        worklogs: {
          orderBy: { workDate: 'asc' }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { verificationPassword, ...orderData } = body
    const validatedData = productionOrderSchema.parse(orderData)
    
    // 檢查訂單是否有密碼鎖且是否修改了客戶指定的原料
    const existingOrder = await prisma.productionOrder.findUnique({
      where: { id: params.id },
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

    const order = await prisma.productionOrder.update({
      where: { id: params.id },
      data: {
        customerName: orderPayload.customerName,
        productName: orderPayload.productName,
        productionQuantity: orderPayload.productionQuantity,
        unitWeightMg,
        batchTotalWeightMg,
        completionDate: orderPayload.completionDate && orderPayload.completionDate !== '' ? new Date(orderPayload.completionDate) : null,
        processIssues: orderPayload.processIssues,
        qualityNotes: orderPayload.qualityNotes,
        capsuleColor: orderPayload.capsuleColor,
        capsuleSize: orderPayload.capsuleSize,
        capsuleType: orderPayload.capsuleType,
        customerService: orderPayload.customerService,
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
        worklogs: {
          orderBy: { workDate: 'asc' }
        }
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
        { error: '驗證失敗', details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '更新訂單失敗' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.productionOrder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '訂單刪除成功' })
  } catch (error) {
    logger.error('刪除訂單錯誤', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: '刪除訂單失敗' },
      { status: 500 }
    )
  }
}
