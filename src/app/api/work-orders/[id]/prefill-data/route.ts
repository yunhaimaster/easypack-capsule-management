import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    const workOrder = await prisma.unifiedWorkOrder.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        personInChargeId: true,
        productionQuantity: true,
        jobNumber: true
      }
    })
    
    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: '工作單不存在' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        customerName: workOrder.customerName,
        customerServiceId: workOrder.personInChargeId || 'UNASSIGNED',
        productionQuantity: workOrder.productionQuantity || 1,
        workOrderId: id,  // Include for form submission
        workOrderJobNumber: workOrder.jobNumber  // For display
      }
    })
  } catch (error) {
    console.error('[Prefill Data] Error:', error)
    return NextResponse.json(
      { success: false, error: '載入工作單資料失敗' },
      { status: 500 }
    )
  }
}

