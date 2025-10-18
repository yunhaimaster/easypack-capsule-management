'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { productionOrderSchema } from '@/lib/validations'

// Production Order Actions
export async function createProductionOrder(
  _prevState: { message: string; errors?: Record<string, string[]> },
  formData: FormData
) {
  const rawData = {
    customerName: formData.get('customerName'),
    productName: formData.get('productName'),
    productionQuantity: Number(formData.get('productionQuantity')),
    unitWeightMg: Number(formData.get('unitWeightMg')) || 500,
    batchTotalWeightMg: Number(formData.get('batchTotalWeightMg')) || 0,
    notes: formData.get('notes'),
    customerService: formData.get('customerService'),
  }

  const result = productionOrderSchema.safeParse(rawData)

  if (!result.success) {
    return {
      message: '驗證失敗',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const order = await prisma.productionOrder.create({
      data: result.data as any,
    })

    logger.info('生產訂單創建成功', { orderId: order.id })
    revalidatePath('/orders')
    redirect(`/orders/${order.id}`)
  } catch (error) {
    logger.error('創建生產訂單錯誤', {
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      message: '創建訂單失敗，請重試',
      errors: {},
    }
  }
}

export async function updateProductionOrder(
  _prevState: { message: string; errors?: Record<string, string[]> },
  formData: FormData
) {
  const orderId = formData.get('orderId') as string
  const rawData = {
    customerName: formData.get('customerName'),
    productName: formData.get('productName'),
    productionQuantity: Number(formData.get('productionQuantity')),
    unitWeightMg: Number(formData.get('unitWeightMg')) || 500,
    batchTotalWeightMg: Number(formData.get('batchTotalWeightMg')) || 0,
    notes: formData.get('notes'),
    customerService: formData.get('customerService'),
  }

  const result = productionOrderSchema.safeParse(rawData)

  if (!result.success) {
    return {
      message: '驗證失敗',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    await prisma.productionOrder.update({
      where: { id: orderId },
      data: result.data as any,
    })

    logger.info('生產訂單更新成功', { orderId })
    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    redirect(`/orders/${orderId}`)
  } catch (error) {
    logger.error('更新生產訂單錯誤', {
      error: error instanceof Error ? error.message : String(error),
      orderId,
    })
    return {
      message: '更新訂單失敗，請重試',
      errors: {},
    }
  }
}

// Worklog Actions
const worklogSchema = z.object({
  orderId: z.string().min(1, '訂單ID不能為空'),
  startTime: z.string().min(1, '開始時間不能為空'),
  endTime: z.string().min(1, '結束時間不能為空'),
  workType: z.enum(['preparation', 'production', 'packaging', 'quality_control', 'other']),
  notes: z.string().optional(),
})

export async function createWorklog(
  _prevState: { message: string; errors?: Record<string, string[]> },
  formData: FormData
) {
  const rawData = {
    orderId: formData.get('orderId'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    workType: formData.get('workType'),
    notes: formData.get('notes'),
  }

  const result = worklogSchema.safeParse(rawData)

  if (!result.success) {
    return {
      message: '驗證失敗',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const worklog = await prisma.orderWorklog.create({
      data: result.data as any,
    })

    logger.info('工時記錄創建成功', { worklogId: worklog.id })
    revalidatePath(`/orders/${result.data.orderId}`)
    revalidatePath('/worklogs')
    
    return {
      message: '工時記錄創建成功',
      errors: {},
    }
  } catch (error) {
    logger.error('創建工時記錄錯誤', {
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      message: '創建工時記錄失敗，請重試',
      errors: {},
    }
  }
}

// Recipe Library Actions
const recipeSchema = z.object({
  recipeName: z.string().min(1, '配方名稱不能為空'),
  recipeType: z.enum(['template', 'standard', 'custom']),
  targetEffects: z.string().min(1, '目標功效不能為空'),
  notes: z.string().optional(),
})

export async function createRecipe(
  _prevState: { message: string; errors?: Record<string, string[]> },
  formData: FormData
) {
  const rawData = {
    recipeName: formData.get('recipeName'),
    recipeType: formData.get('recipeType'),
    targetEffects: formData.get('targetEffects'),
    notes: formData.get('notes'),
  }

  const result = recipeSchema.safeParse(rawData)

  if (!result.success) {
    return {
      message: '驗證失敗',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const recipe = await prisma.recipeLibrary.create({
      data: result.data as any,
    })

    logger.info('配方創建成功', { recipeId: recipe.id })
    revalidatePath('/recipe-library')
    redirect(`/recipe-library/${recipe.id}`)
  } catch (error) {
    logger.error('創建配方錯誤', {
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      message: '創建配方失敗，請重試',
      errors: {},
    }
  }
}

export async function updateRecipe(
  _prevState: { message: string; errors?: Record<string, string[]> },
  formData: FormData
) {
  const recipeId = formData.get('recipeId') as string
  const rawData = {
    recipeName: formData.get('recipeName'),
    recipeType: formData.get('recipeType'),
    targetEffects: formData.get('targetEffects'),
    notes: formData.get('notes'),
  }

  const result = recipeSchema.safeParse(rawData)

  if (!result.success) {
    return {
      message: '驗證失敗',
      errors: result.error.flatten().fieldErrors,
    }
  }

  try {
    await prisma.recipeLibrary.update({
      where: { id: recipeId },
      data: result.data as any,
    })

    logger.info('配方更新成功', { recipeId })
    revalidatePath('/recipe-library')
    revalidatePath(`/recipe-library/${recipeId}`)
    
    return {
      message: '配方更新成功',
      errors: {},
    }
  } catch (error) {
    logger.error('更新配方錯誤', {
      error: error instanceof Error ? error.message : String(error),
      recipeId,
    })
    return {
      message: '更新配方失敗，請重試',
      errors: {},
    }
  }
}

// Delete Actions
export async function deleteOrder(orderId: string) {
  try {
    await prisma.productionOrder.delete({
      where: { id: orderId },
    })

    logger.info('訂單刪除成功', { orderId })
    revalidatePath('/orders')
    redirect('/orders')
  } catch (error) {
    logger.error('刪除訂單錯誤', {
      error: error instanceof Error ? error.message : String(error),
      orderId,
    })
    throw new Error('刪除訂單失敗')
  }
}

export async function deleteRecipe(recipeId: string) {
  try {
    await prisma.recipeLibrary.delete({
      where: { id: recipeId },
    })

    logger.info('配方刪除成功', { recipeId })
    revalidatePath('/recipe-library')
    redirect('/recipe-library')
  } catch (error) {
    logger.error('刪除配方錯誤', {
      error: error instanceof Error ? error.message : String(error),
      recipeId,
    })
    throw new Error('刪除配方失敗')
  }
}

// Optimistic Actions for React 19 useOptimistic
export async function createOrderOptimistic(formData: FormData) {
  const rawData = {
    customerName: formData.get('customerName'),
    productName: formData.get('productName'),
    productionQuantity: Number(formData.get('productionQuantity')),
    unitWeightMg: Number(formData.get('unitWeightMg')) || 500,
    batchTotalWeightMg: Number(formData.get('batchTotalWeightMg')) || 0,
    notes: formData.get('notes'),
    customerService: formData.get('customerService'),
  }

  const result = productionOrderSchema.safeParse(rawData)

  if (!result.success) {
    throw new Error('Validation failed: ' + JSON.stringify(result.error.flatten().fieldErrors))
  }

  try {
    const order = await prisma.productionOrder.create({
      data: result.data as any,
    })

    logger.info('Order created successfully', { orderId: order.id })
    revalidatePath('/orders')
    return { success: true, orderId: order.id, order }
  } catch (error) {
    logger.error('Failed to create order', { error })
    throw new Error('Failed to create order')
  }
}

export async function updateOrderOptimistic(orderId: string, formData: FormData) {
  const rawData = {
    customerName: formData.get('customerName'),
    productName: formData.get('productName'),
    productionQuantity: Number(formData.get('productionQuantity')),
    unitWeightMg: Number(formData.get('unitWeightMg')) || 500,
    batchTotalWeightMg: Number(formData.get('batchTotalWeightMg')) || 0,
    notes: formData.get('notes'),
    customerService: formData.get('customerService'),
  }

  const result = productionOrderSchema.safeParse(rawData)

  if (!result.success) {
    throw new Error('Validation failed: ' + JSON.stringify(result.error.flatten().fieldErrors))
  }

  try {
    const order = await prisma.productionOrder.update({
      where: { id: orderId },
      data: result.data as any,
    })

    logger.info('Order updated successfully', { orderId })
    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { success: true, order }
  } catch (error) {
    logger.error('Failed to update order', { error, orderId })
    throw new Error('Failed to update order')
  }
}

export async function deleteOrderOptimistic(orderId: string) {
  try {
    await prisma.productionOrder.delete({
      where: { id: orderId },
    })

    logger.info('Order deleted successfully', { orderId })
    revalidatePath('/orders')
    return { success: true, orderId }
  } catch (error) {
    logger.error('Failed to delete order', { error, orderId })
    throw new Error('Failed to delete order')
  }
}
