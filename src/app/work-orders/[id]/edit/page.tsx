'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useWorkOrder, useUpdateWorkOrder, useUsers } from '@/lib/queries/work-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Text } from '@/components/ui/text'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditWorkOrderPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: workOrderData, isLoading } = useWorkOrder(id)
  const updateMutation = useUpdateWorkOrder()
  const { data: users, isLoading: usersLoading } = useUsers()

  const workOrder = workOrderData as any

  const [formData, setFormData] = useState({
    jobNumber: '',
    customerName: '',
    personInChargeId: 'UNASSIGNED',
    workType: 'PACKAGING' as const,
    workDescription: '',
    
    isCustomerServiceVip: false,
    isBossVip: false,
    
    expectedProductionMaterialsDate: '',
    expectedPackagingMaterialsDate: '',
    productionMaterialsReady: false,
    packagingMaterialsReady: false,
    
    productionQuantity: '',
    productionQuantityStat: '',
    packagingQuantity: '',
    packagingQuantityStat: '',
    
    requestedDeliveryDate: '',
    internalExpectedDate: '',
    
    isUrgent: false,
    productionStarted: false,
    isCompleted: false
  })

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Populate form when work order loads
  useEffect(() => {
    if (workOrder) {
      console.log('[EditPage] Loading workOrder data:')
      console.log('  - workOrder.personInChargeId:', workOrder.personInChargeId)
      console.log('  - Will set to:', workOrder.personInChargeId || 'UNASSIGNED')
      
      setFormData({
        jobNumber: workOrder.jobNumber || '',
        customerName: workOrder.customerName,
        personInChargeId: workOrder.personInChargeId || 'UNASSIGNED',
        workType: workOrder.workType,
        workDescription: workOrder.workDescription,
        
        isCustomerServiceVip: workOrder.isCustomerServiceVip,
        isBossVip: workOrder.isBossVip,
        
        expectedProductionMaterialsDate: workOrder.expectedProductionMaterialsDate 
          ? new Date(workOrder.expectedProductionMaterialsDate).toISOString().split('T')[0]
          : '',
        expectedPackagingMaterialsDate: workOrder.expectedPackagingMaterialsDate
          ? new Date(workOrder.expectedPackagingMaterialsDate).toISOString().split('T')[0]
          : '',
        productionMaterialsReady: workOrder.productionMaterialsReady,
        packagingMaterialsReady: workOrder.packagingMaterialsReady,
        
        productionQuantity: workOrder.productionQuantity?.toString() || '',
        productionQuantityStat: workOrder.productionQuantityStat || '',
        packagingQuantity: workOrder.packagingQuantity?.toString() || '',
        packagingQuantityStat: workOrder.packagingQuantityStat || '',
        
        requestedDeliveryDate: workOrder.requestedDeliveryDate
          ? new Date(workOrder.requestedDeliveryDate).toISOString().split('T')[0]
          : '',
        internalExpectedDate: workOrder.internalExpectedDate
          ? new Date(workOrder.internalExpectedDate).toISOString().split('T')[0]
          : '',
        
        isUrgent: workOrder.isUrgent,
        productionStarted: workOrder.productionStarted,
        isCompleted: workOrder.isCompleted
      })
      
      console.log('[EditPage] Form data updated')
    }
  }, [workOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const payload: any = {
        jobNumber: formData.jobNumber.trim() || null,
        customerName: formData.customerName.trim(),
        personInChargeId: formData.personInChargeId === 'UNASSIGNED' ? null : formData.personInChargeId,
        workType: formData.workType,
        workDescription: formData.workDescription.trim(),
        
        isCustomerServiceVip: formData.isCustomerServiceVip,
        isBossVip: formData.isBossVip,
        
        expectedProductionMaterialsDate: formData.expectedProductionMaterialsDate 
          ? new Date(formData.expectedProductionMaterialsDate).toISOString()
          : null,
        expectedPackagingMaterialsDate: formData.expectedPackagingMaterialsDate
          ? new Date(formData.expectedPackagingMaterialsDate).toISOString()
          : null,
        productionMaterialsReady: formData.productionMaterialsReady,
        packagingMaterialsReady: formData.packagingMaterialsReady,
        
        productionQuantity: formData.productionQuantity ? parseInt(formData.productionQuantity) : null,
        productionQuantityStat: formData.productionQuantityStat || null,
        packagingQuantity: formData.packagingQuantity ? parseInt(formData.packagingQuantity) : null,
        packagingQuantityStat: formData.packagingQuantityStat || null,
        
        requestedDeliveryDate: formData.requestedDeliveryDate
          ? new Date(formData.requestedDeliveryDate).toISOString()
          : null,
        internalExpectedDate: formData.internalExpectedDate
          ? new Date(formData.internalExpectedDate).toISOString()
          : null,
        
        isUrgent: formData.isUrgent,
        productionStarted: formData.productionStarted,
        isCompleted: formData.isCompleted
      }

      // Debug: Log what we're sending
      console.log('[EditPage] Sending payload:', payload)
      console.log('[EditPage] personInChargeId:', payload.personInChargeId)

      await updateMutation.mutateAsync({ id, data: payload })
      
      console.log('[EditPage] Update successful')
      setSuccessMessage('工作單更新成功！')
      
      setTimeout(() => {
        router.push(`/work-orders/${id}` as never)
      }, 1500)
    } catch (error: any) {
      console.error('[EditPage] Update failed:', error)
      
      // Extract detailed error message
      let errorMessage = '更新工作單失敗，請稍後重試'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      
      console.error('[EditPage] Detailed error:', errorMessage)
      setErrorMessage(errorMessage)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen logo-bg-animation flex flex-col">
        <LiquidGlassNav />
        <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 floating-combined flex-1">
          <div className="max-w-4xl mx-auto">
            <Card className="liquid-glass-card transition-apple">
              <CardContent className="p-8 sm:p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <LoadingSpinner size="lg" />
                  <Text.Secondary className="text-center">載入工作單資料中...</Text.Secondary>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <LiquidGlassFooter />
      </div>
    )
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen logo-bg-animation flex flex-col">
        <LiquidGlassNav />
        <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 floating-combined flex-1">
          <div className="max-w-4xl mx-auto">
            <Card className="liquid-glass-card border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 transition-apple">
              <CardContent className="pt-6">
                <Text.Danger className="text-center">工作單不存在</Text.Danger>
              </CardContent>
            </Card>
          </div>
        </div>
        <LiquidGlassFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 pb-12 sm:pb-16 space-y-8 floating-combined">
        <div className="max-w-4xl mx-auto">{/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/work-orders/${id}` as never)}
            className="transition-apple"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回詳情
          </Button>
          <Text.Primary as="h1" className="text-xl sm:text-2xl lg:text-3xl font-bold">
            編輯工作單
          </Text.Primary>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 sm:p-5 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg transition-apple">
          <Text.Success className="font-medium text-sm sm:text-base">
            {successMessage}
          </Text.Success>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 sm:p-5 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg transition-apple">
          <Text.Danger className="font-medium text-sm sm:text-base">
            {errorMessage}
          </Text.Danger>
        </div>
      )}

      {/* Form - Same structure as create page */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                  訂單編號（如有）
                </Text.Primary>
                <Input
                  value={formData.jobNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobNumber: e.target.value }))}
                  placeholder="例如: JOB-2025-001"
                  className="transition-apple h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div>
                <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                  客戶名稱 <Text.Danger as="span">*</Text.Danger>
                </Text.Primary>
                <Input
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="輸入客戶名稱"
                  className="transition-apple h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              <div>
                <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                  負責人 <Text.Danger as="span">*</Text.Danger>
                </Text.Primary>
                {usersLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <Text.Tertiary className="text-xs sm:text-sm">
                      載入用戶列表中...
                    </Text.Tertiary>
                  </div>
                ) : (
                  <>
                    {console.log('[EditPage] Rendering Select with:')}
                    {console.log('  - formData.personInChargeId:', formData.personInChargeId)}
                    {console.log('  - users count:', users?.length)}
                    {console.log('  - users IDs:', users?.map((u: any) => u.id))}
                    <Select
                      value={formData.personInChargeId}
                      onValueChange={(value) => {
                        console.log('[EditPage] Select value changed to:', value)
                        setFormData(prev => ({ ...prev, personInChargeId: value }))
                      }}
                    >
                      <SelectTrigger className="transition-apple h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="請選擇負責人" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED" className="text-sm sm:text-base">
                          未指定
                        </SelectItem>
                        {users?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id} className="text-sm sm:text-base">
                            {user.nickname || user.phoneE164}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>

              <div>
                <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                  工作類型 <Text.Danger as="span">*</Text.Danger>
                </Text.Primary>
                <Select
                  value={formData.workType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, workType: value as any }))}
                >
                  <SelectTrigger className="transition-apple h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue placeholder="請選擇工作類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PACKAGING" className="text-sm sm:text-base">包裝</SelectItem>
                    <SelectItem value="PRODUCTION" className="text-sm sm:text-base">生產</SelectItem>
                    <SelectItem value="PRODUCTION_PACKAGING" className="text-sm sm:text-base">生產+包裝</SelectItem>
                    <SelectItem value="WAREHOUSING" className="text-sm sm:text-base">倉務</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* VIP標記 */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 sm:pt-8 transition-apple">
              <Text.Primary as="h3" className="text-base sm:text-lg font-semibold mb-4 sm:mb-5">
                VIP標記
              </Text.Primary>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isCustomerServiceVip"
                    checked={formData.isCustomerServiceVip}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCustomerServiceVip: checked as boolean }))}
                    className="transition-apple"
                  />
                  {/* NOTE: Using raw label because Text component doesn't support htmlFor */}
                  <label 
                    htmlFor="isCustomerServiceVip" 
                    className="text-sm sm:text-base font-medium leading-none cursor-pointer transition-apple hover:text-primary-600 text-neutral-800 dark:text-white/95"
                  >
                    客服VIP
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isBossVip"
                    checked={formData.isBossVip}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBossVip: checked as boolean }))}
                    className="transition-apple"
                  />
                  <label 
                    htmlFor="isBossVip" 
                    className="text-sm sm:text-base font-medium leading-none cursor-pointer transition-apple hover:text-primary-600 text-neutral-800 dark:text-white/95"
                  >
                    老闆VIP
                  </label>
                </div>
              </div>
            </div>

            {/* 物料到齊狀態 */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 sm:pt-8 transition-apple">
              <Text.Primary as="h3" className="text-base sm:text-lg font-semibold mb-4 sm:mb-5">
                物料到齊狀態
              </Text.Primary>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 mb-4 sm:mb-5">
                <div>
                  <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                    預計生產物料到齊的日期
                  </Text.Primary>
                  <Input
                    type="date"
                    value={formData.expectedProductionMaterialsDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedProductionMaterialsDate: e.target.value }))}
                    className="transition-apple h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                    預計包裝物料到齊的日期
                  </Text.Primary>
                  <Input
                    type="date"
                    value={formData.expectedPackagingMaterialsDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedPackagingMaterialsDate: e.target.value }))}
                    className="transition-apple h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="productionMaterialsReady"
                    checked={formData.productionMaterialsReady}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, productionMaterialsReady: checked as boolean }))}
                    className="transition-apple"
                  />
                  <label 
                    htmlFor="productionMaterialsReady" 
                    className="text-sm sm:text-base font-medium leading-none cursor-pointer transition-apple hover:text-success-600 text-neutral-800 dark:text-white/95"
                  >
                    生產物料齊
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="packagingMaterialsReady"
                    checked={formData.packagingMaterialsReady}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, packagingMaterialsReady: checked as boolean }))}
                    className="transition-apple"
                  />
                  <label 
                    htmlFor="packagingMaterialsReady" 
                    className="text-sm sm:text-base font-medium leading-none cursor-pointer transition-apple hover:text-success-600 text-neutral-800 dark:text-white/95"
                  >
                    包裝物料齊
                  </label>
                </div>
              </div>
            </div>

            {/* 數量 */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 sm:pt-8 transition-apple">
              <div className="mb-4 sm:mb-5">
                <Text.Primary as="h3" className="text-base sm:text-lg font-semibold inline">
                  數量
                </Text.Primary>
                <Text.Tertiary as="span" className="text-xs sm:text-sm ml-2 sm:ml-3">
                  （可選，不同單位：如包裝用瓶數、生產用粒數）
                </Text.Tertiary>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                    生產數量
                  </Text.Primary>
                  <div className="grid grid-cols-[1fr,auto] gap-2 sm:gap-3">
                    <Input
                      type="number"
                      value={formData.productionQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, productionQuantity: e.target.value }))}
                      placeholder="例如: 10000"
                      className="transition-apple h-10 sm:h-11 text-sm sm:text-base"
                    />
                    <Select
                      value={formData.productionQuantityStat || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, productionQuantityStat: value }))}
                    >
                      <SelectTrigger className="w-[100px] sm:w-[120px] h-10 sm:h-11 text-sm sm:text-base transition-apple">
                        <SelectValue placeholder="單位" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="粒">粒</SelectItem>
                        <SelectItem value="瓶">瓶</SelectItem>
                        <SelectItem value="盒">盒</SelectItem>
                        <SelectItem value="袋">袋</SelectItem>
                        <SelectItem value="包">包</SelectItem>
                        <SelectItem value="排">排</SelectItem>
                        <SelectItem value="公斤">公斤</SelectItem>
                        <SelectItem value="克">克</SelectItem>
                        <SelectItem value="個">個</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Text.Tertiary className="text-xs mt-1">
                    提示：生產通常用「粒」計算
                  </Text.Tertiary>
                </div>
                <div>
                  <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                    包裝數量
                  </Text.Primary>
                  <div className="grid grid-cols-[1fr,auto] gap-2 sm:gap-3">
                    <Input
                      type="number"
                      value={formData.packagingQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, packagingQuantity: e.target.value }))}
                      placeholder="例如: 5000"
                      className="transition-apple h-10 sm:h-11 text-sm sm:text-base"
                    />
                    <Select
                      value={formData.packagingQuantityStat || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, packagingQuantityStat: value }))}
                    >
                      <SelectTrigger className="w-[100px] sm:w-[120px] h-10 sm:h-11 text-sm sm:text-base transition-apple">
                        <SelectValue placeholder="單位" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="粒">粒</SelectItem>
                        <SelectItem value="瓶">瓶</SelectItem>
                        <SelectItem value="盒">盒</SelectItem>
                        <SelectItem value="袋">袋</SelectItem>
                        <SelectItem value="包">包</SelectItem>
                        <SelectItem value="排">排</SelectItem>
                        <SelectItem value="公斤">公斤</SelectItem>
                        <SelectItem value="克">克</SelectItem>
                        <SelectItem value="個">個</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Text.Tertiary className="text-xs mt-1">
                    提示：包裝通常用「瓶」、「盒」等計算
                  </Text.Tertiary>
                </div>
              </div>
            </div>

            {/* 交貨期 */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 sm:pt-8 transition-apple">
              <div className="mb-4 sm:mb-5">
                <Text.Primary as="h3" className="text-base sm:text-lg font-semibold inline">
                  交貨期
                </Text.Primary>
                <Text.Tertiary as="span" className="text-xs sm:text-sm ml-2 sm:ml-3">
                  （可選，支援導入歷史資料）
                </Text.Tertiary>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                    要求交貨的日期
                  </Text.Primary>
                  <Input
                    type="date"
                    value={formData.requestedDeliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestedDeliveryDate: e.target.value }))}
                    className="transition-apple h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                    內部預計交貨期
                  </Text.Primary>
                  <Input
                    type="date"
                    value={formData.internalExpectedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, internalExpectedDate: e.target.value }))}
                    className="transition-apple h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            {/* 狀態標記 */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 sm:pt-8 transition-apple">
              <Text.Primary as="h3" className="text-base sm:text-lg font-semibold mb-4 sm:mb-5">
                狀態標記
              </Text.Primary>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isUrgent"
                    checked={formData.isUrgent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: checked as boolean }))}
                    className="transition-apple"
                  />
                  <label 
                    htmlFor="isUrgent" 
                    className="text-sm sm:text-base font-medium leading-none cursor-pointer transition-apple hover:text-warning-600 text-neutral-800 dark:text-white/95"
                  >
                    客人要求加急
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="productionStarted"
                    checked={formData.productionStarted}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, productionStarted: checked as boolean }))}
                    className="transition-apple"
                  />
                  <label 
                    htmlFor="productionStarted" 
                    className="text-sm sm:text-base font-medium leading-none cursor-pointer transition-apple hover:text-info-600 text-neutral-800 dark:text-white/95"
                  >
                    已開生產線
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isCompleted"
                    checked={formData.isCompleted}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCompleted: checked as boolean }))}
                    className="transition-apple"
                  />
                  <label 
                    htmlFor="isCompleted" 
                    className="text-sm sm:text-base font-medium leading-none cursor-pointer transition-apple hover:text-success-600 text-neutral-800 dark:text-white/95"
                  >
                    已經完成
                  </label>
                </div>
              </div>
            </div>

            {/* 工作描述 */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 sm:pt-8 transition-apple">
              <Text.Primary as="label" className="block text-sm sm:text-base font-medium mb-2">
                工作描述 <Text.Danger as="span">*</Text.Danger>
              </Text.Primary>
              <Textarea
                required
                value={formData.workDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                placeholder="描述此工作單的具體內容..."
                rows={5}
                className="transition-apple text-sm sm:text-base"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/30 transition-all duration-300 touch-feedback order-1 sm:order-1 min-w-[140px] justify-center"
              >
                {updateMutation.isPending ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>更新中...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    <span>儲存變更</span>
                  </div>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/work-orders/${id}` as never)}
                disabled={updateMutation.isPending}
                className="transition-apple order-2 sm:order-2"
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
        </div>
      </div>
      <LiquidGlassFooter />
    </div>
  )
}

