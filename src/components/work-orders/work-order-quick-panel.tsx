/**
 * Work Order Quick Panel Component
 * 
 * Displays work order details in a side drawer without leaving the page.
 * Supports viewing and editing all fields with bulk save functionality.
 * Similar to manager scheduling panel but adapted for work orders.
 */

'use client'

import { useState, useEffect } from 'react'
import { WorkOrder, WORK_TYPE_LABELS, WORK_ORDER_STATUS_LABELS } from '@/types/work-order'
import { User } from '@/types/work-order'
import { WorkType, WorkOrderStatus } from '@prisma/client'
import { QuickViewDrawer } from '@/components/ui/quick-view-drawer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast-provider'
import { ExternalLink, Save, Loader2, Star, Factory, Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDateOnly } from '@/lib/utils'
import Link from 'next/link'

interface WorkOrderQuickPanelProps {
  isOpen: boolean
  onClose: () => void
  workOrder: WorkOrder | null
  users: User[]
  canEdit: boolean
  onSave: (workOrderId: string, field: string, value: string | number | boolean | null) => Promise<void>
  saving: Set<string>
}

export function WorkOrderQuickPanel({
  isOpen,
  onClose,
  workOrder,
  users,
  canEdit,
  onSave,
  saving
}: WorkOrderQuickPanelProps) {
  const { showToast } = useToast()
  const [editedFields, setEditedFields] = useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Reset edited fields when work order changes
  useEffect(() => {
    if (workOrder) {
      setEditedFields({
        customerName: workOrder.customerName || '',
        jobNumber: workOrder.jobNumber || '',
        workDescription: workOrder.workDescription || '',
        notes: workOrder.notes || '',
        personInChargeId: workOrder.personInChargeId || 'UNASSIGNED',
        workType: workOrder.workType,
        requestedDeliveryDate: workOrder.requestedDeliveryDate 
          ? new Date(workOrder.requestedDeliveryDate).toISOString().split('T')[0]
          : '',
        internalExpectedDate: workOrder.internalExpectedDate 
          ? new Date(workOrder.internalExpectedDate).toISOString().split('T')[0]
          : '',
        productionQuantity: workOrder.productionQuantity?.toString() || '',
        packagingQuantity: workOrder.packagingQuantity?.toString() || '',
        isUrgent: workOrder.isUrgent,
        productionStarted: workOrder.productionStarted,
        isCompleted: workOrder.isCompleted,
        isCustomerServiceVip: workOrder.isCustomerServiceVip,
        isBossVip: workOrder.isBossVip,
        productionMaterialsReady: workOrder.productionMaterialsReady,
        packagingMaterialsReady: workOrder.packagingMaterialsReady,
        expectedProductionMaterialsDate: workOrder.expectedProductionMaterialsDate
          ? new Date(workOrder.expectedProductionMaterialsDate).toISOString().split('T')[0]
          : '',
        expectedPackagingMaterialsDate: workOrder.expectedPackagingMaterialsDate
          ? new Date(workOrder.expectedPackagingMaterialsDate).toISOString().split('T')[0]
          : '',
        productionQuantityStat: workOrder.productionQuantityStat || '',
        packagingQuantityStat: workOrder.packagingQuantityStat || '',
      })
    }
  }, [workOrder])

  if (!workOrder) return null

  const handleFieldChange = (field: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveAll = async () => {
    if (!workOrder) return
    
    setIsSaving(true)
    try {
      // Save all changed fields
      const promises: Promise<void>[] = []
      
      Object.entries(editedFields).forEach(([field, value]) => {
        const originalValue = getOriginalValue(workOrder, field)
        
        // Convert value types as needed
        let processedValue: any = value
        
        if (field === 'productionQuantity' || field === 'packagingQuantity') {
          processedValue = value === '' ? null : parseInt(value)
        } else if (field.includes('Date') && value !== '') {
          processedValue = new Date(value + 'T00:00:00').toISOString()
        } else if (field.includes('Date') && value === '') {
          processedValue = null
        } else if (field === 'personInChargeId' && value === 'UNASSIGNED') {
          processedValue = null
        }
        
        // Compare processed value with original
        if (field.includes('Date')) {
          // Date comparison - both should be YYYY-MM-DD strings
          const origDate = originalValue as string
          const newDate = value as string
          if (origDate !== newDate) {
            promises.push(onSave(workOrder.id, field, processedValue))
          }
        } else if (processedValue !== originalValue) {
          promises.push(onSave(workOrder.id, field, processedValue))
        }
      })
      
      await Promise.all(promises)
      showToast({ title: '儲存成功' })
    } catch (error) {
      showToast({
        title: '儲存失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getOriginalValue = (wo: WorkOrder, field: string): any => {
    switch (field) {
      case 'customerName': return wo.customerName
      case 'jobNumber': return wo.jobNumber || ''
      case 'workDescription': return wo.workDescription || ''
      case 'notes': return wo.notes || ''
      case 'personInChargeId': return wo.personInChargeId || 'UNASSIGNED'
      case 'workType': return wo.workType
      case 'requestedDeliveryDate': return wo.requestedDeliveryDate 
        ? new Date(wo.requestedDeliveryDate).toISOString().split('T')[0]
        : ''
      case 'internalExpectedDate': return wo.internalExpectedDate
        ? new Date(wo.internalExpectedDate).toISOString().split('T')[0]
        : ''
      case 'productionQuantity': return wo.productionQuantity?.toString() || ''
      case 'packagingQuantity': return wo.packagingQuantity?.toString() || ''
      case 'isUrgent': return wo.isUrgent
      case 'productionStarted': return wo.productionStarted
      case 'isCompleted': return wo.isCompleted
      case 'isCustomerServiceVip': return wo.isCustomerServiceVip
      case 'isBossVip': return wo.isBossVip
      case 'productionMaterialsReady': return wo.productionMaterialsReady
      case 'packagingMaterialsReady': return wo.packagingMaterialsReady
      case 'expectedProductionMaterialsDate': return wo.expectedProductionMaterialsDate
        ? new Date(wo.expectedProductionMaterialsDate).toISOString().split('T')[0]
        : ''
      case 'expectedPackagingMaterialsDate': return wo.expectedPackagingMaterialsDate
        ? new Date(wo.expectedPackagingMaterialsDate).toISOString().split('T')[0]
        : ''
      case 'productionQuantityStat': return wo.productionQuantityStat || ''
      case 'packagingQuantityStat': return wo.packagingQuantityStat || ''
      default: return ''
    }
  }

  const hasChanges = Object.keys(editedFields).some(field => {
    const originalValue = getOriginalValue(workOrder, field)
    const editedValue = editedFields[field]
    
    if (field.includes('Date')) {
      const origDate = originalValue ? new Date(originalValue as Date).toISOString().split('T')[0] : ''
      const newDate = editedValue as string
      return origDate !== newDate
    }
    
    return editedValue !== originalValue
  })

  // Check if production materials are applicable for this work type
  const hasProductionMaterials = (workType: WorkType) => 
    workType === WorkType.PRODUCTION || workType === WorkType.PRODUCTION_PACKAGING

  // Check if packaging materials are applicable for this work type
  const hasPackagingMaterials = (workType: WorkType) =>
    workType === WorkType.PACKAGING || workType === WorkType.PRODUCTION_PACKAGING

  return (
    <QuickViewDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={workOrder.customerName}
    >
      <div className="p-6 space-y-6">
        {/* Header Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge 
            variant={
              workOrder.workType === WorkType.PRODUCTION ? 'success' :
              workOrder.workType === WorkType.PRODUCTION_PACKAGING ? 'info' :
              workOrder.workType === WorkType.PACKAGING ? 'secondary' :
              'outline'
            }
          >
            {WORK_TYPE_LABELS[workOrder.workType]}
          </Badge>
          
          {workOrder.status && (
            <Badge variant={
              workOrder.status === WorkOrderStatus.COMPLETED ? 'success' :
              workOrder.status === WorkOrderStatus.CANCELLED ? 'danger' :
              'warning'
            }>
              {WORK_ORDER_STATUS_LABELS[workOrder.status]}
            </Badge>
          )}
          
          {workOrder.isCustomerServiceVip && (
            <Badge variant="warning" className="gap-1">
              <Star className="h-3 w-3" />
              客服VIP
            </Badge>
          )}
          
          {workOrder.isBossVip && (
            <Badge variant="danger" className="gap-1">
              <Star className="h-3 w-3" />
              老闆VIP
            </Badge>
          )}
          
          {workOrder.isUrgent && (
            <Badge variant="danger" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              加急
            </Badge>
          )}
          
          {workOrder.isCompleted && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              已完成
            </Badge>
          )}
        </div>

        {/* Basic Info Card */}
        <Card className="liquid-glass-card">
          <CardContent className="liquid-glass-content p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">創建日期</span>
                <div className="font-medium text-neutral-900 dark:text-white mt-1">
                  {formatDateOnly(workOrder.markedDate)}
                </div>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">負責人</span>
                <div className="font-medium text-neutral-900 dark:text-white mt-1">
                  {workOrder.personInCharge?.nickname || 
                   workOrder.personInCharge?.phoneE164 || 
                   '未指派'}
                </div>
              </div>
              {/* Only show production quantity if applicable */}
              {hasProductionMaterials(workOrder.workType) && workOrder.productionQuantity && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">生產數量</span>
                  <div className="font-medium text-neutral-900 dark:text-white mt-1">
                    {workOrder.productionQuantity} {workOrder.productionQuantityStat || '個'}
                  </div>
                </div>
              )}
              {/* Only show packaging quantity if applicable */}
              {hasPackagingMaterials(workOrder.workType) && workOrder.packagingQuantity && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">包裝數量</span>
                  <div className="font-medium text-neutral-900 dark:text-white mt-1">
                    {workOrder.packagingQuantity} {workOrder.packagingQuantityStat || '個'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editable Fields */}
        <div className="space-y-4">
          {/* Customer Name */}
          <div>
            <Label htmlFor="customerName" className="text-sm font-medium mb-2 block">
              客戶名稱 <span className="text-danger-500">*</span>
            </Label>
            <Input
              id="customerName"
              value={editedFields.customerName || ''}
              onChange={(e) => handleFieldChange('customerName', e.target.value)}
              disabled={!canEdit}
              className="transition-apple"
              placeholder="請輸入客戶名稱..."
            />
          </div>

          {/* Job Number */}
          <div>
            <Label htmlFor="jobNumber" className="text-sm font-medium mb-2 block">
              訂單編號
            </Label>
            <Input
              id="jobNumber"
              value={editedFields.jobNumber || ''}
              onChange={(e) => handleFieldChange('jobNumber', e.target.value)}
              disabled={!canEdit}
              className="transition-apple"
              placeholder="請輸入訂單編號..."
            />
          </div>

          {/* Person in Charge */}
          <div>
            <Label htmlFor="personInChargeId" className="text-sm font-medium mb-2 block">
              負責人
            </Label>
            <Select
              value={editedFields.personInChargeId || 'UNASSIGNED'}
              onValueChange={(value) => handleFieldChange('personInChargeId', value)}
              disabled={!canEdit}
            >
              <SelectTrigger className="transition-apple">
                <SelectValue placeholder="選擇負責人" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">未指定</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nickname || user.phoneE164}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work Type */}
          <div>
            <Label htmlFor="workType" className="text-sm font-medium mb-2 block">
              工作類型 <span className="text-danger-500">*</span>
            </Label>
            <Select
              value={editedFields.workType}
              onValueChange={(value) => handleFieldChange('workType', value as WorkType)}
              disabled={!canEdit}
            >
              <SelectTrigger className="transition-apple">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-4">
            {/* Only show production quantity input if applicable */}
            {hasProductionMaterials(workOrder.workType) && (
              <div>
                <Label htmlFor="productionQuantity" className="text-sm font-medium mb-2 block">
                  生產數量
                </Label>
                <Input
                  id="productionQuantity"
                  type="number"
                  value={editedFields.productionQuantity || ''}
                  onChange={(e) => handleFieldChange('productionQuantity', e.target.value)}
                  disabled={!canEdit}
                  className="transition-apple"
                  placeholder="0"
                />
              </div>
            )}
            {/* Only show packaging quantity input if applicable */}
            {hasPackagingMaterials(workOrder.workType) && (
              <div>
                <Label htmlFor="packagingQuantity" className="text-sm font-medium mb-2 block">
                  包裝數量
                </Label>
                <Input
                  id="packagingQuantity"
                  type="number"
                  value={editedFields.packagingQuantity || ''}
                  onChange={(e) => handleFieldChange('packagingQuantity', e.target.value)}
                  disabled={!canEdit}
                  className="transition-apple"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Delivery Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requestedDeliveryDate" className="text-sm font-medium mb-2 block">
                要求交貨期
              </Label>
              <Input
                id="requestedDeliveryDate"
                type="date"
                value={editedFields.requestedDeliveryDate || ''}
                onChange={(e) => handleFieldChange('requestedDeliveryDate', e.target.value)}
                disabled={!canEdit}
                className="transition-apple"
              />
            </div>
            <div>
              <Label htmlFor="internalExpectedDate" className="text-sm font-medium mb-2 block">
                內部預計交貨期
              </Label>
              <Input
                id="internalExpectedDate"
                type="date"
                value={editedFields.internalExpectedDate || ''}
                onChange={(e) => handleFieldChange('internalExpectedDate', e.target.value)}
                disabled={!canEdit}
                className="transition-apple"
              />
            </div>
          </div>

          {/* Material Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expectedProductionMaterialsDate" className="text-sm font-medium mb-2 block">
                預計生產物料到齊日期
              </Label>
              <Input
                id="expectedProductionMaterialsDate"
                type="date"
                value={editedFields.expectedProductionMaterialsDate || ''}
                onChange={(e) => handleFieldChange('expectedProductionMaterialsDate', e.target.value)}
                disabled={!canEdit}
                className="transition-apple"
              />
            </div>
            <div>
              <Label htmlFor="expectedPackagingMaterialsDate" className="text-sm font-medium mb-2 block">
                預計包裝物料到齊日期
              </Label>
              <Input
                id="expectedPackagingMaterialsDate"
                type="date"
                value={editedFields.expectedPackagingMaterialsDate || ''}
                onChange={(e) => handleFieldChange('expectedPackagingMaterialsDate', e.target.value)}
                disabled={!canEdit}
                className="transition-apple"
              />
            </div>
          </div>

          {/* Status Flags - Reordered by workflow logic */}
          <div className="space-y-2">
            {/* Group 1: VIP & Priority Flags (First) */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCustomerServiceVip"
                checked={editedFields.isCustomerServiceVip}
                onCheckedChange={(checked) => handleFieldChange('isCustomerServiceVip', checked)}
                disabled={!canEdit}
              />
              <Label htmlFor="isCustomerServiceVip" className="text-sm font-medium cursor-pointer">
                客服VIP
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isBossVip"
                checked={editedFields.isBossVip}
                onCheckedChange={(checked) => handleFieldChange('isBossVip', checked)}
                disabled={!canEdit}
              />
              <Label htmlFor="isBossVip" className="text-sm font-medium cursor-pointer">
                老闆VIP
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isUrgent"
                checked={editedFields.isUrgent}
                onCheckedChange={(checked) => handleFieldChange('isUrgent', checked)}
                disabled={!canEdit}
              />
              <Label htmlFor="isUrgent" className="text-sm font-medium cursor-pointer">
                客人要求加急
              </Label>
            </div>
            
            {/* Group 2: Material Ready Status */}
            {/* Production materials - only for PRODUCTION and PRODUCTION_PACKAGING */}
            {hasProductionMaterials(workOrder.workType) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="productionMaterialsReady"
                  checked={editedFields.productionMaterialsReady}
                  onCheckedChange={(checked) => handleFieldChange('productionMaterialsReady', checked)}
                  disabled={!canEdit}
                />
                <Label htmlFor="productionMaterialsReady" className="text-sm font-medium cursor-pointer">
                  生產物料齊
                </Label>
              </div>
            )}
            
            {/* Packaging materials - only for PACKAGING and PRODUCTION_PACKAGING */}
            {hasPackagingMaterials(workOrder.workType) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="packagingMaterialsReady"
                  checked={editedFields.packagingMaterialsReady}
                  onCheckedChange={(checked) => handleFieldChange('packagingMaterialsReady', checked)}
                  disabled={!canEdit}
                />
                <Label htmlFor="packagingMaterialsReady" className="text-sm font-medium cursor-pointer">
                  包裝物料齊
                </Label>
              </div>
            )}
            
            {/* Group 3: Work Progress */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="productionStarted"
                checked={editedFields.productionStarted}
                onCheckedChange={(checked) => handleFieldChange('productionStarted', checked)}
                disabled={!canEdit}
              />
              <Label htmlFor="productionStarted" className="text-sm font-medium cursor-pointer">
                已開生產線
              </Label>
            </div>
            
            {/* Group 4: Final Status (Last) */}
            {/* Only show completed toggle if status is not already COMPLETED */}
            {workOrder.status !== 'COMPLETED' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCompleted"
                  checked={editedFields.isCompleted}
                  onCheckedChange={(checked) => handleFieldChange('isCompleted', checked)}
                  disabled={!canEdit}
                />
                <Label htmlFor="isCompleted" className="text-sm font-medium cursor-pointer">
                  已經完成
                </Label>
              </div>
            )}
          </div>

          {/* Work Description */}
          <div>
            <Label htmlFor="workDescription" className="text-sm font-medium mb-2 block">
              工作描述
            </Label>
            <Textarea
              id="workDescription"
              value={editedFields.workDescription || ''}
              onChange={(e) => handleFieldChange('workDescription', e.target.value)}
              disabled={!canEdit}
              className="min-h-[120px] resize-none"
              placeholder="請輸入工作描述..."
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
              備註
            </Label>
            <Textarea
              id="notes"
              value={editedFields.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              disabled={!canEdit}
              className="min-h-[100px] resize-none"
              placeholder="請輸入備註..."
            />
          </div>
        </div>

        {/* Related Orders Section */}
        {((workOrder.capsulationOrder || (workOrder.productionOrders && workOrder.productionOrders.length > 0))) && (
          <Card className="liquid-glass-card">
            <CardContent className="liquid-glass-content p-4">
              <h3 className="text-sm font-semibold mb-3">關聯訂單</h3>
              <div className="space-y-2">
                {workOrder.capsulationOrder && (
                  <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary-600" />
                      <span className="text-sm font-medium">膠囊訂單</span>
                      <span className="text-xs text-neutral-500">{workOrder.capsulationOrder.productName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7"
                    >
                      <Link href={`/work-orders/${workOrder.id}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
                {workOrder.productionOrders?.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-success-600" />
                      <span className="text-sm font-medium">生產訂單</span>
                      <span className="text-xs text-neutral-500">{order.productName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7"
                    >
                      <Link href={`/orders/${order.id}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          {canEdit && hasChanges && (
            <Button
              onClick={handleSaveAll}
              disabled={isSaving || saving.has(workOrder.id)}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
            >
              {isSaving || saving.has(workOrder.id) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  儲存變更
                </>
              )}
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <Link href={`/work-orders/${workOrder.id}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                工作單頁面
              </Link>
            </Button>
            
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <Link href={`/work-orders/${workOrder.id}/edit`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                完整編輯
              </Link>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            關閉
          </Button>
        </div>
      </div>
    </QuickViewDrawer>
  )
}

