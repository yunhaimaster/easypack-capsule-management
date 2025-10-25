/**
 * Create Work Order Page
 * 
 * Production-ready form with:
 * - React Hook Form + Zod validation
 * - Design system components only
 * - Flexible validation for historical data import
 * - Fully responsive (mobile + desktop)
 * - Light/dark mode support
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateWorkOrder, useUsers } from '@/lib/queries/work-orders'
import { workOrderFormSchema, type WorkOrderFormData } from '@/lib/validations/work-order-validation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ArrowLeft, Save } from 'lucide-react'
import type { CreateWorkOrderPayload, User } from '@/types/work-order'

export default function CreateWorkOrderPage() {
  const router = useRouter()
  const createMutation = useCreateWorkOrder()
  const { data: users, isLoading: usersLoading } = useUsers()

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Initialize React Hook Form with Zod validation
  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      jobNumber: '',
      customerName: '',
      personInChargeId: '',
      workType: 'PACKAGING',
      workDescription: '',
      isCustomerServiceVip: false,
      isBossVip: false,
      expectedProductionMaterialsDate: '',
      expectedPackagingMaterialsDate: '',
      productionMaterialsReady: false,
      packagingMaterialsReady: false,
      productionQuantity: null,
      packagingQuantity: null,
      requestedDeliveryDate: '',
      internalExpectedDate: '',
      isUrgent: false,
      productionStarted: false,
      isCompleted: false,
    }
  })

  const handleSubmit = async (data: WorkOrderFormData) => {
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const payload: CreateWorkOrderPayload = {
        jobNumber: data.jobNumber || null,
        customerName: data.customerName.trim(),
        personInChargeId: data.personInChargeId,
        workType: data.workType,
        workDescription: data.workDescription.trim(),
        
        // VIP flags
        isCustomerServiceVip: data.isCustomerServiceVip,
        isBossVip: data.isBossVip,
        
        // Material dates (convert to Date if not empty)
        expectedProductionMaterialsDate: data.expectedProductionMaterialsDate 
          ? new Date(data.expectedProductionMaterialsDate)
          : null,
        expectedPackagingMaterialsDate: data.expectedPackagingMaterialsDate 
          ? new Date(data.expectedPackagingMaterialsDate)
          : null,
        productionMaterialsReady: data.productionMaterialsReady,
        packagingMaterialsReady: data.packagingMaterialsReady,
        
        // Quantities
        productionQuantity: data.productionQuantity || null,
        packagingQuantity: data.packagingQuantity || null,
        
        // Delivery dates (convert to Date if not empty)
        requestedDeliveryDate: data.requestedDeliveryDate 
          ? new Date(data.requestedDeliveryDate)
          : null,
        internalExpectedDate: data.internalExpectedDate 
          ? new Date(data.internalExpectedDate)
          : null,
        
        // Status flags
        isUrgent: data.isUrgent,
        productionStarted: data.productionStarted,
        isCompleted: data.isCompleted
      }

      await createMutation.mutateAsync(payload)
      setSuccessMessage('工作單創建成功！')
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/work-orders')
      }, 1500)
    } catch (error: unknown) {
      console.error('創建失敗:', error)
      const message = error instanceof Error ? error.message : '創建工作單失敗，請稍後重試'
      setErrorMessage(message)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/work-orders')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white/95">創建新工作單</h1>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg text-success-700 dark:text-success-400">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg text-danger-700 dark:text-danger-400">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Number */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                  訂單編號（如有）
                </label>
                <Input
                  {...form.register('jobNumber')}
                  placeholder="例如: JOB-2025-001"
                />
                {form.formState.errors.jobNumber && (
                  <p className="text-sm text-danger-600 mt-1">
                    {form.formState.errors.jobNumber.message}
                  </p>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                  客戶名稱 <span className="text-danger-600">*</span>
                </label>
                <Input
                  {...form.register('customerName')}
                  placeholder="輸入客戶名稱"
                />
                {form.formState.errors.customerName && (
                  <p className="text-sm text-danger-600 mt-1">
                    {form.formState.errors.customerName.message}
                  </p>
                )}
              </div>

              {/* Person in Charge */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                  負責人 <span className="text-danger-600">*</span>
                </label>
                {usersLoading ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-white/65">
                    <LoadingSpinner size="sm" />
                    <span>載入用戶列表中...</span>
                  </div>
                ) : (
                  <Select
                    value={form.watch('personInChargeId')}
                    onValueChange={(value) => form.setValue('personInChargeId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇負責人" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.nickname || user.phoneE164}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {form.formState.errors.personInChargeId && (
                  <p className="text-sm text-danger-600 mt-1">
                    {form.formState.errors.personInChargeId.message}
                  </p>
                )}
              </div>

              {/* Work Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                  工作類型 <span className="text-danger-600">*</span>
                </label>
                <Select
                  value={form.watch('workType')}
                  onValueChange={(value) => form.setValue('workType', value as 'PACKAGING' | 'PRODUCTION' | 'PRODUCTION_PACKAGING' | 'WAREHOUSING')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇工作類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PACKAGING">包裝</SelectItem>
                    <SelectItem value="PRODUCTION">生產</SelectItem>
                    <SelectItem value="PRODUCTION_PACKAGING">生產+包裝</SelectItem>
                    <SelectItem value="WAREHOUSING">倉務</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.workType && (
                  <p className="text-sm text-danger-600 mt-1">
                    {form.formState.errors.workType.message}
                  </p>
                )}
              </div>
            </div>

            {/* VIP Flags Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 dark:text-white/95 mb-4">VIP標記</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCustomerServiceVip"
                    checked={form.watch('isCustomerServiceVip')}
                    onCheckedChange={(checked) => form.setValue('isCustomerServiceVip', checked as boolean)}
                  />
                  <label 
                    htmlFor="isCustomerServiceVip" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    客服VIP
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isBossVip"
                    checked={form.watch('isBossVip')}
                    onCheckedChange={(checked) => form.setValue('isBossVip', checked as boolean)}
                  />
                  <label 
                    htmlFor="isBossVip" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    老闆VIP
                  </label>
                </div>
              </div>
            </div>

            {/* Material Ready Status Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 dark:text-white/95 mb-4">物料到齊狀態</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    預計生產物料到齊的日期
                  </label>
                  <Input
                    type="date"
                    {...form.register('expectedProductionMaterialsDate')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    預計包裝物料到齊的日期
                  </label>
                  <Input
                    type="date"
                    {...form.register('expectedPackagingMaterialsDate')}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="productionMaterialsReady"
                    checked={form.watch('productionMaterialsReady')}
                    onCheckedChange={(checked) => form.setValue('productionMaterialsReady', checked as boolean)}
                  />
                  <label 
                    htmlFor="productionMaterialsReady" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    生產物料齊
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="packagingMaterialsReady"
                    checked={form.watch('packagingMaterialsReady')}
                    onCheckedChange={(checked) => form.setValue('packagingMaterialsReady', checked as boolean)}
                  />
                  <label 
                    htmlFor="packagingMaterialsReady" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    包裝物料齊
                  </label>
                </div>
              </div>
            </div>

            {/* Quantities Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 dark:text-white/95 mb-4">
                數量
                <span className="text-sm font-normal text-neutral-500 dark:text-white/65 ml-2">
                  （可選，不同單位：如包裝用瓶數、生產用粒數）
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    生產數量
                  </label>
                  <Input
                    type="number"
                    {...form.register('productionQuantity', { 
                      setValueAs: v => v === '' || v === null ? null : parseInt(v)
                    })}
                    placeholder="例如: 10000"
                  />
                  {form.formState.errors.productionQuantity && (
                    <p className="text-sm text-danger-600 mt-1">
                      {form.formState.errors.productionQuantity.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    包裝數量
                  </label>
                  <Input
                    type="number"
                    {...form.register('packagingQuantity', {
                      setValueAs: v => v === '' || v === null ? null : parseInt(v)
                    })}
                    placeholder="例如: 5000"
                  />
                  {form.formState.errors.packagingQuantity && (
                    <p className="text-sm text-danger-600 mt-1">
                      {form.formState.errors.packagingQuantity.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Dates Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 dark:text-white/95 mb-4">
                交貨期
                <span className="text-sm font-normal text-neutral-500 dark:text-white/65 ml-2">
                  （可選，支援導入歷史資料）
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    要求交貨的日期
                  </label>
                  <Input
                    type="date"
                    {...form.register('requestedDeliveryDate')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                    內部預計交貨期
                  </label>
                  <Input
                    type="date"
                    {...form.register('internalExpectedDate')}
                  />
                </div>
              </div>
            </div>

            {/* Status Flags Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 dark:text-white/95 mb-4">狀態標記</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isUrgent"
                    checked={form.watch('isUrgent')}
                    onCheckedChange={(checked) => form.setValue('isUrgent', checked as boolean)}
                  />
                  <label 
                    htmlFor="isUrgent" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    客人要求加急
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="productionStarted"
                    checked={form.watch('productionStarted')}
                    onCheckedChange={(checked) => form.setValue('productionStarted', checked as boolean)}
                  />
                  <label 
                    htmlFor="productionStarted" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    已開生產線
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCompleted"
                    checked={form.watch('isCompleted')}
                    onCheckedChange={(checked) => form.setValue('isCompleted', checked as boolean)}
                  />
                  <label 
                    htmlFor="isCompleted" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    已經完成
                  </label>
                </div>
              </div>
            </div>

            {/* Work Description Section */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                工作描述 <span className="text-danger-600">*</span>
              </label>
              <Textarea
                {...form.register('workDescription')}
                placeholder="描述此工作單的具體內容..."
                rows={4}
              />
              {form.formState.errors.workDescription && (
                <p className="text-sm text-danger-600 mt-1">
                  {form.formState.errors.workDescription.message}
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {createMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    創建中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    創建工作單
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/work-orders')}
                disabled={createMutation.isPending}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dev Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6 border-info-200 bg-info-50 dark:bg-info-900/20 dark:border-info-800">
          <CardHeader>
            <CardTitle className="text-info-700 dark:text-info-400">開發信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-neutral-700 dark:text-white/85">
                <strong>當前狀態:</strong> 完整表單（生產就緒版）
              </p>
              <p className="text-neutral-700 dark:text-white/85">
                <strong>驗證方式:</strong> React Hook Form + Zod
              </p>
              <p className="text-neutral-700 dark:text-white/85">
                <strong>設計系統:</strong> 完全符合統一設計規範
              </p>
              <p className="text-neutral-700 dark:text-white/85">
                <strong>API端點:</strong> POST /api/work-orders
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
