'use client'

import { useParams, useRouter } from 'next/navigation'
import { useWorkOrder } from '@/lib/queries/work-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Text } from '@/components/ui/text'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { WORK_TYPE_LABELS, WORK_ORDER_STATUS_LABELS, CapsulationIngredient } from '@/types/work-order'

export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading, error } = useWorkOrder(id)
  const workOrder = data as any

  if (isLoading) {
    return (
      <div className="min-h-screen logo-bg-animation flex flex-col">
        <LiquidGlassNav />
        <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 floating-combined flex-1">
          <div className="max-w-6xl mx-auto">
            <Card className="liquid-glass-card transition-apple">
              <CardContent className="p-8 sm:p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <LoadingSpinner size="lg" />
                  <Text.Secondary className="text-center">載入工作單詳情中...</Text.Secondary>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <LiquidGlassFooter />
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <div className="min-h-screen logo-bg-animation flex flex-col">
        <LiquidGlassNav />
        <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 floating-combined flex-1">
          <div className="max-w-6xl mx-auto">
            <Card className="liquid-glass-card border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 transition-apple">
              <CardContent className="pt-6">
                <Text.Danger className="text-center">
                  載入失敗：{error instanceof Error ? error.message : '工作單不存在'}
                </Text.Danger>
              </CardContent>
            </Card>
          </div>
        </div>
        <LiquidGlassFooter />
      </div>
    )
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8 floating-combined">
        <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="transition-apple self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <div>
            <Text.Primary as="h1" className="text-2xl sm:text-3xl font-bold">
              工作單詳情
            </Text.Primary>
            {workOrder.jobNumber && (
              <Text.Secondary className="text-sm sm:text-base mt-1">
                訂單編號: {workOrder.jobNumber}
              </Text.Secondary>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => router.push(`/work-orders/${id}/edit` as never)}
            className="transition-apple"
          >
            <Edit className="h-4 w-4 mr-2" />
            編輯
          </Button>
        </div>
      </div>

      {/* Status and VIP Tags */}
      <Card className="mb-6 card-interactive-apple transition-apple">
        <CardContent className="pt-5 sm:pt-6">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Text.Tertiary as="span" className="text-xs sm:text-sm">
                狀態:
              </Text.Tertiary>
              <Badge variant="info">{(WORK_ORDER_STATUS_LABELS as any)[workOrder.status]}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Text.Tertiary as="span" className="text-xs sm:text-sm">
                工作類型:
              </Text.Tertiary>
              <Badge variant="default">{(WORK_TYPE_LABELS as any)[workOrder.workType]}</Badge>
            </div>
            {workOrder.isCustomerServiceVip && (
              <Badge variant="warning">客服VIP</Badge>
            )}
            {workOrder.isBossVip && (
              <Badge variant="danger">老闆VIP</Badge>
            )}
            {workOrder.isUrgent && (
              <Badge variant="danger">客人要求加急</Badge>
            )}
            {workOrder.productionStarted && (
              <Badge variant="success">已開生產線</Badge>
            )}
            {workOrder.isCompleted && (
              <Badge variant="success">已經完成</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* 基本信息 */}
        <Card className="card-interactive-apple transition-apple">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                客戶名稱
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {workOrder.customerName}
              </Text.Primary>
            </div>
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                負責人
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '-'}
              </Text.Primary>
            </div>
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                創建日期
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {formatDate(workOrder.markedDate)}
              </Text.Primary>
            </div>
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                工作描述
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base whitespace-pre-wrap">
                {workOrder.workDescription}
              </Text.Primary>
            </div>
          </CardContent>
        </Card>

        {/* 物料到齊狀態 */}
        <Card className="card-interactive-apple transition-apple">
          <CardHeader>
            <CardTitle>物料到齊狀態</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                預計生產物料到齊日期
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {formatDate(workOrder.expectedProductionMaterialsDate)}
              </Text.Primary>
            </div>
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                預計包裝物料到齊日期
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {formatDate(workOrder.expectedPackagingMaterialsDate)}
              </Text.Primary>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                {workOrder.productionMaterialsReady ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success-600" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 dark:text-neutral-600" />
                )}
                <Text.Primary 
                  as="span" 
                  className={`text-xs sm:text-sm ${
                    workOrder.productionMaterialsReady ? 'text-success-600' : ''
                  }`}
                >
                  生產物料齊
                </Text.Primary>
              </div>
              <div className="flex items-center gap-2">
                {workOrder.packagingMaterialsReady ? (
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success-600" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 dark:text-neutral-600" />
                )}
                <Text.Primary 
                  as="span" 
                  className={`text-xs sm:text-sm ${
                    workOrder.packagingMaterialsReady ? 'text-success-600' : ''
                  }`}
                >
                  包裝物料齊
                </Text.Primary>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 數量信息 */}
        <Card className="card-interactive-apple transition-apple">
          <CardHeader>
            <CardTitle>數量信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                生產數量
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {workOrder.productionQuantity 
                  ? `${workOrder.productionQuantity.toLocaleString()}${workOrder.productionQuantityStat ? ` ${workOrder.productionQuantityStat}` : ''}`
                  : '-'}
              </Text.Primary>
            </div>
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                包裝數量
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {workOrder.packagingQuantity 
                  ? `${workOrder.packagingQuantity.toLocaleString()}${workOrder.packagingQuantityStat ? ` ${workOrder.packagingQuantityStat}` : ''}`
                  : '-'}
              </Text.Primary>
            </div>
          </CardContent>
        </Card>

        {/* 交貨期信息 */}
        <Card className="card-interactive-apple transition-apple">
          <CardHeader>
            <CardTitle>交貨期信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5">
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                要求交貨的日期
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {formatDate(workOrder.requestedDeliveryDate)}
              </Text.Primary>
            </div>
            <div>
              <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                內部預計交貨期
              </Text.Tertiary>
              <Text.Primary className="text-sm sm:text-base">
                {formatDate(workOrder.internalExpectedDate)}
              </Text.Primary>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capsulation Order (if exists) */}
      {workOrder.capsulationOrder && (
        <Card className="mt-5 sm:mt-6 card-interactive-apple transition-apple">
          <CardHeader>
            <CardTitle>膠囊訂單詳情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                  產品名稱
                </Text.Tertiary>
                <Text.Primary className="text-sm sm:text-base">
                  {workOrder.capsulationOrder.productName}
                </Text.Primary>
              </div>
              <div>
                <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                  生產數量
                </Text.Tertiary>
                <Text.Primary className="text-sm sm:text-base">
                  {workOrder.capsulationOrder.productionQuantity.toLocaleString()}
                </Text.Primary>
              </div>
              <div>
                <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                  膠囊顏色
                </Text.Tertiary>
                <Text.Primary className="text-sm sm:text-base">
                  {workOrder.capsulationOrder.capsuleColor || '-'}
                </Text.Primary>
              </div>
              <div>
                <Text.Tertiary as="label" className="text-xs sm:text-sm font-medium block mb-1.5">
                  膠囊尺寸
                </Text.Tertiary>
                <Text.Primary className="text-sm sm:text-base">
                  {workOrder.capsulationOrder.capsuleSize || '-'}
                </Text.Primary>
              </div>
            </div>

            {workOrder.capsulationOrder.ingredients && workOrder.capsulationOrder.ingredients.length > 0 && (
              <div className="mt-5 sm:mt-6">
                <Text.Primary as="h4" className="text-sm sm:text-base font-semibold mb-3">
                  配方成分
                </Text.Primary>
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden transition-apple">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">
                          原料名稱
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm text-right">
                          單位含量 (mg)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrder.capsulationOrder.ingredients.map((ing: CapsulationIngredient, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs sm:text-sm">
                            {ing.materialName}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm text-right">
                            {ing.unitContentMg}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card className="mt-5 sm:mt-6 card-interactive-apple transition-apple">
        <CardContent className="pt-5 sm:pt-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Text.Tertiary className="text-xs sm:text-sm">
                創建時間: {formatDate(workOrder.createdAt)}
              </Text.Tertiary>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Text.Tertiary className="text-xs sm:text-sm">
                最後更新: {formatDate(workOrder.updatedAt)}
              </Text.Tertiary>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
      <LiquidGlassFooter />
    </div>
  )
}

