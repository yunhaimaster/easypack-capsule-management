'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateWorkOrder, useUsers } from '@/lib/queries/work-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'

export default function CreateWorkOrderPage() {
  const router = useRouter()
  const createMutation = useCreateWorkOrder()
  const { data: users, isLoading: usersLoading } = useUsers()

  const [formData, setFormData] = useState({
    jobNumber: '',
    customerName: '',
    personInChargeId: '',
    workType: 'PACKAGING' as const,
    workDescription: '',
    
    // VIP標記
    isCustomerServiceVip: false,
    isBossVip: false,
    
    // 物料到齊狀態
    expectedProductionMaterialsDate: '',
    expectedPackagingMaterialsDate: '',
    productionMaterialsReady: false,
    packagingMaterialsReady: false,
    
    // 數量
    productionQuantity: '',
    packagingQuantity: '',
    
    // 交貨期
    requestedDeliveryDate: '',
    internalExpectedDate: '',
    
    // 狀態標記
    isUrgent: false,
    productionStarted: false,
    isCompleted: false
  })

  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const payload: any = {
        jobNumber: formData.jobNumber.trim() || null,
        customerName: formData.customerName.trim(),
        personInChargeId: formData.personInChargeId,
        workType: formData.workType,
        workDescription: formData.workDescription.trim(),
        
        // VIP標記
        isCustomerServiceVip: formData.isCustomerServiceVip,
        isBossVip: formData.isBossVip,
        
        // 物料到齊狀態
        expectedProductionMaterialsDate: formData.expectedProductionMaterialsDate ? new Date(formData.expectedProductionMaterialsDate).toISOString() : null,
        expectedPackagingMaterialsDate: formData.expectedPackagingMaterialsDate ? new Date(formData.expectedPackagingMaterialsDate).toISOString() : null,
        productionMaterialsReady: formData.productionMaterialsReady,
        packagingMaterialsReady: formData.packagingMaterialsReady,
        
        // 數量
        productionQuantity: formData.productionQuantity ? parseInt(formData.productionQuantity) : null,
        packagingQuantity: formData.packagingQuantity ? parseInt(formData.packagingQuantity) : null,
        
        // 交貨期
        requestedDeliveryDate: formData.requestedDeliveryDate ? new Date(formData.requestedDeliveryDate).toISOString() : null,
        internalExpectedDate: formData.internalExpectedDate ? new Date(formData.internalExpectedDate).toISOString() : null,
        
        // 狀態標記
        isUrgent: formData.isUrgent,
        productionStarted: formData.productionStarted,
        isCompleted: formData.isCompleted
      }

      await createMutation.mutateAsync(payload)
      setSuccessMessage('工作單創建成功！')
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/work-orders')
      }, 1500)
    } catch (error: any) {
      console.error('創建失敗:', error)
      setErrorMessage(error?.message || '創建工作單失敗，請稍後重試')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/work-orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-800">創建新工作單</h1>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg text-success-700">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 訂單編號（如有） */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  訂單編號（如有）
                </label>
                <Input
                  value={formData.jobNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobNumber: e.target.value }))}
                  placeholder="例如: JOB-2025-001"
                />
              </div>

              {/* 客戶名稱 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  客戶名稱 <span className="text-danger-600">*</span>
                </label>
                <Input
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="輸入客戶名稱"
                />
              </div>

              {/* 負責人 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  負責人 <span className="text-danger-600">*</span>
                </label>
                {usersLoading ? (
                  <div className="text-sm text-neutral-500">載入用戶列表中...</div>
                ) : (
                  <select
                    required
                    value={formData.personInChargeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, personInChargeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">請選擇負責人</option>
                    {users?.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.nickname || user.phoneE164}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 工作類型 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  工作類型 <span className="text-danger-600">*</span>
                </label>
                <select
                  required
                  value={formData.workType}
                  onChange={(e) => setFormData(prev => ({ ...prev, workType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PACKAGING">包裝</option>
                  <option value="PRODUCTION">生產</option>
                  <option value="PRODUCTION_PACKAGING">生產+包裝</option>
                  <option value="WAREHOUSING">倉務</option>
                </select>
              </div>
            </div>

            {/* VIP標記 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">VIP標記</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCustomerServiceVip"
                    checked={formData.isCustomerServiceVip}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCustomerServiceVip: checked as boolean }))}
                  />
                  <label htmlFor="isCustomerServiceVip" className="text-sm font-medium leading-none">
                    客服VIP
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isBossVip"
                    checked={formData.isBossVip}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isBossVip: checked as boolean }))}
                  />
                  <label htmlFor="isBossVip" className="text-sm font-medium leading-none">
                    老闆VIP
                  </label>
                </div>
              </div>
            </div>

            {/* 物料到齊狀態 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">物料到齊狀態</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    預計生產物料到齊的日期
                  </label>
                  <Input
                    type="date"
                    value={formData.expectedProductionMaterialsDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedProductionMaterialsDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    預計包裝物料到齊的日期
                  </label>
                  <Input
                    type="date"
                    value={formData.expectedPackagingMaterialsDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedPackagingMaterialsDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="productionMaterialsReady"
                    checked={formData.productionMaterialsReady}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, productionMaterialsReady: checked as boolean }))}
                  />
                  <label htmlFor="productionMaterialsReady" className="text-sm font-medium leading-none">
                    生產物料齊
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="packagingMaterialsReady"
                    checked={formData.packagingMaterialsReady}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, packagingMaterialsReady: checked as boolean }))}
                  />
                  <label htmlFor="packagingMaterialsReady" className="text-sm font-medium leading-none">
                    包裝物料齊
                  </label>
                </div>
              </div>
            </div>

            {/* 數量 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">數量</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    生產數量
                  </label>
                  <Input
                    type="number"
                    value={formData.productionQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, productionQuantity: e.target.value }))}
                    placeholder="例如: 10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    包裝數量
                  </label>
                  <Input
                    type="number"
                    value={formData.packagingQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, packagingQuantity: e.target.value }))}
                    placeholder="例如: 5000"
                  />
                </div>
              </div>
            </div>

            {/* 交貨期 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">交貨期</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    要求交貨的日期
                  </label>
                  <Input
                    type="date"
                    value={formData.requestedDeliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestedDeliveryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    內部預計交貨期
                  </label>
                  <Input
                    type="date"
                    value={formData.internalExpectedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, internalExpectedDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* 狀態標記 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-neutral-800 mb-4">狀態標記</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isUrgent"
                    checked={formData.isUrgent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isUrgent: checked as boolean }))}
                  />
                  <label htmlFor="isUrgent" className="text-sm font-medium leading-none">
                    客人要求加急
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="productionStarted"
                    checked={formData.productionStarted}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, productionStarted: checked as boolean }))}
                  />
                  <label htmlFor="productionStarted" className="text-sm font-medium leading-none">
                    已開生產線
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isCompleted"
                    checked={formData.isCompleted}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCompleted: checked as boolean }))}
                  />
                  <label htmlFor="isCompleted" className="text-sm font-medium leading-none">
                    已經完成
                  </label>
                </div>
              </div>
            </div>

            {/* 工作描述 */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                工作描述 <span className="text-danger-600">*</span>
              </label>
              <textarea
                required
                value={formData.workDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
                placeholder="描述此工作單的具體內容..."
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
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
        <Card className="mt-6 border-info-200 bg-info-50">
          <CardHeader>
            <CardTitle className="text-info-700">開發信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-neutral-700">
                <strong>當前狀態:</strong> 完整表單（更新版）
              </p>
              <p className="text-neutral-700">
                <strong>已實現:</strong> 所有必填與可選欄位
              </p>
              <p className="text-neutral-700">
                <strong>待實現:</strong> 膠囊訂單關聯、高級驗證
              </p>
              <p className="text-neutral-700">
                <strong>API端點:</strong> POST /api/work-orders
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
