'use client'

import { useParams, useRouter } from 'next/navigation'
import { useWorkOrder } from '@/lib/queries/work-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { WORK_TYPE_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'

export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading, error } = useWorkOrder(id)
  const workOrder = data as any

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Card className="border-danger-200 bg-danger-50">
          <CardContent className="pt-6">
            <p className="text-danger-700">載入失敗：{error instanceof Error ? error.message : '工作單不存在'}</p>
          </CardContent>
        </Card>
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/work-orders' as never)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">工作單詳情</h1>
            {workOrder.jobNumber && (
              <p className="text-neutral-600 mt-1">訂單編號: {workOrder.jobNumber}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => router.push(`/work-orders/${id}/edit` as never)}
          >
            <Edit className="h-4 w-4 mr-2" />
            編輯
          </Button>
        </div>
      </div>

      {/* Status and VIP Tags */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-sm text-neutral-600 mr-2">狀態:</span>
              <Badge variant="info">{(WORK_ORDER_STATUS_LABELS as any)[workOrder.status]}</Badge>
            </div>
            <div>
              <span className="text-sm text-neutral-600 mr-2">工作類型:</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">客戶名稱</label>
              <p className="text-neutral-900 mt-1">{workOrder.customerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">負責人</label>
              <p className="text-neutral-900 mt-1">
                {workOrder.personInCharge?.nickname || workOrder.personInCharge?.phoneE164 || '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">創建日期</label>
              <p className="text-neutral-900 mt-1">{formatDate(workOrder.markedDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">工作描述</label>
              <p className="text-neutral-900 mt-1 whitespace-pre-wrap">{workOrder.workDescription}</p>
            </div>
          </CardContent>
        </Card>

        {/* 物料到齊狀態 */}
        <Card>
          <CardHeader>
            <CardTitle>物料到齊狀態</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">預計生產物料到齊日期</label>
              <p className="text-neutral-900 mt-1">{formatDate(workOrder.expectedProductionMaterialsDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">預計包裝物料到齊日期</label>
              <p className="text-neutral-900 mt-1">{formatDate(workOrder.expectedPackagingMaterialsDate)}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {workOrder.productionMaterialsReady ? (
                  <CheckCircle className="h-5 w-5 text-success-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-neutral-400" />
                )}
                <span className={workOrder.productionMaterialsReady ? 'text-success-700' : 'text-neutral-600'}>
                  生產物料齊
                </span>
              </div>
              <div className="flex items-center gap-2">
                {workOrder.packagingMaterialsReady ? (
                  <CheckCircle className="h-5 w-5 text-success-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-neutral-400" />
                )}
                <span className={workOrder.packagingMaterialsReady ? 'text-success-700' : 'text-neutral-600'}>
                  包裝物料齊
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 數量信息 */}
        <Card>
          <CardHeader>
            <CardTitle>數量信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">生產數量</label>
              <p className="text-neutral-900 mt-1">
                {workOrder.productionQuantity ? workOrder.productionQuantity.toLocaleString() : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">包裝數量</label>
              <p className="text-neutral-900 mt-1">
                {workOrder.packagingQuantity ? workOrder.packagingQuantity.toLocaleString() : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 交貨期信息 */}
        <Card>
          <CardHeader>
            <CardTitle>交貨期信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">要求交貨的日期</label>
              <p className="text-neutral-900 mt-1">{formatDate(workOrder.requestedDeliveryDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-600">內部預計交貨期</label>
              <p className="text-neutral-900 mt-1">{formatDate(workOrder.internalExpectedDate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capsulation Order (if exists) */}
      {workOrder.capsulationOrder && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>膠囊訂單詳情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-600">產品名稱</label>
                <p className="text-neutral-900 mt-1">{workOrder.capsulationOrder.productName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">生產數量</label>
                <p className="text-neutral-900 mt-1">
                  {workOrder.capsulationOrder.productionQuantity.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">膠囊顏色</label>
                <p className="text-neutral-900 mt-1">{workOrder.capsulationOrder.capsuleColor || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">膠囊尺寸</label>
                <p className="text-neutral-900 mt-1">{workOrder.capsulationOrder.capsuleSize || '-'}</p>
              </div>
            </div>

            {workOrder.capsulationOrder.ingredients && workOrder.capsulationOrder.ingredients.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-neutral-900 mb-3">配方成分</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-neutral-700">原料名稱</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-neutral-700">單位含量 (mg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrder.capsulationOrder.ingredients.map((ing: any, index: number) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2 text-neutral-900">{ing.materialName}</td>
                          <td className="px-4 py-2 text-right text-neutral-900">{ing.unitContentMg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-8 text-sm text-neutral-600">
            <div>
              <Clock className="h-4 w-4 inline mr-1" />
              創建時間: {formatDate(workOrder.createdAt)}
            </div>
            <div>
              <Clock className="h-4 w-4 inline mr-1" />
              最後更新: {formatDate(workOrder.updatedAt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

