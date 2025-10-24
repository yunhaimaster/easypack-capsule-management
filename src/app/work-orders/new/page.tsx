/**
 * Work Order Create Page - Complete Form
 * 
 * Full-featured form with all required and important optional fields
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateWorkOrder, useUsers } from '@/lib/queries/work-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

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
    markedDate: '',
    isNewProductVip: false,
    isComplexityVip: false,
    yearCategory: '',
    expectedCompletionDate: '',
    dataCompleteDate: '',
    productionQuantity: '',
    packagingQuantity: '',
    internalDeliveryTime: '',
    customerRequestedTime: '',
    notes: ''
  })
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    // Validation
    if (!formData.personInChargeId) {
      setError('請選擇負責人')
      return
    }
    
    try {
      const payload: any = {
        jobNumber: formData.jobNumber,
        customerName: formData.customerName,
        personInChargeId: formData.personInChargeId,
        workType: formData.workType,
        workDescription: formData.workDescription,
        isNewProductVip: formData.isNewProductVip,
        isComplexityVip: formData.isComplexityVip
      }
      
      // Add optional fields if they have values
      if (formData.markedDate) {
        payload.markedDate = new Date(formData.markedDate).toISOString()
      }
      if (formData.yearCategory) {
        payload.yearCategory = formData.yearCategory
      }
      if (formData.expectedCompletionDate) {
        payload.expectedCompletionDate = new Date(formData.expectedCompletionDate).toISOString()
      }
      if (formData.dataCompleteDate) {
        payload.dataCompleteDate = new Date(formData.dataCompleteDate).toISOString()
      }
      if (formData.productionQuantity) {
        payload.productionQuantity = parseInt(formData.productionQuantity)
      }
      if (formData.packagingQuantity) {
        payload.packagingQuantity = parseInt(formData.packagingQuantity)
      }
      if (formData.internalDeliveryTime) {
        payload.internalDeliveryTime = formData.internalDeliveryTime
      }
      if (formData.customerRequestedTime) {
        payload.customerRequestedTime = formData.customerRequestedTime
      }
      if (formData.notes) {
        payload.notes = formData.notes
      }
      
      await createMutation.mutateAsync(payload)
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/work-orders')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '創建失敗')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          asChild
          className="mb-4"
        >
          <Link href="/work-orders" as={"/work-orders" as never}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回工作單列表
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold text-neutral-900">新增工作單</h1>
        <p className="text-neutral-600 mt-1">
          創建新的統一工作單記錄
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="mb-6 border-success-200 bg-success-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-success-700">
              <span className="font-semibold">✓ 成功:</span>
              <span>工作單已創建，正在跳轉...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-danger-200 bg-danger-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-danger-700">
              <span className="font-semibold">錯誤:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Job Number */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                JOB標號 <span className="text-danger-600">*</span>
              </label>
              <Input
                required
                value={formData.jobNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, jobNumber: e.target.value }))}
                placeholder="例如: JOB-2025-001"
              />
            </div>

            {/* Marked Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                記號日期
              </label>
              <Input
                type="date"
                value={formData.markedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, markedDate: e.target.value }))}
              />
            </div>

            {/* Customer Name */}
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

            {/* Person In Charge */}
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

            {/* Work Type */}
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

            {/* VIP Flags */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isNewProductVip"
                  checked={formData.isNewProductVip}
                  onChange={(e) => setFormData(prev => ({ ...prev, isNewProductVip: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
                <label htmlFor="isNewProductVip" className="text-sm font-medium text-neutral-700">
                  新產品VIP
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isComplexityVip"
                  checked={formData.isComplexityVip}
                  onChange={(e) => setFormData(prev => ({ ...prev, isComplexityVip: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                />
                <label htmlFor="isComplexityVip" className="text-sm font-medium text-neutral-700">
                  複雜度VIP
                </label>
              </div>
            </div>

            {/* Year Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                年份分類
              </label>
              <Input
                value={formData.yearCategory}
                onChange={(e) => setFormData(prev => ({ ...prev, yearCategory: e.target.value }))}
                placeholder="例如: 2025年第一批"
                maxLength={50}
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Details */}
        <Card>
          <CardHeader>
            <CardTitle>工作詳情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Work Description */}
            <div>
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  預計完成日期
                </label>
                <Input
                  type="date"
                  value={formData.expectedCompletionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedCompletionDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  數據完成日期
                </label>
                <Input
                  type="date"
                  value={formData.dataCompleteDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataCompleteDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Quantities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  生產數量
                </label>
                <Input
                  type="number"
                  value={formData.productionQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, productionQuantity: e.target.value }))}
                  placeholder="例如: 10000"
                  min="0"
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
                  placeholder="例如: 10000"
                  min="0"
                />
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  內部交貨時間
                </label>
                <Input
                  value={formData.internalDeliveryTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, internalDeliveryTime: e.target.value }))}
                  placeholder="例如: 2天"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  客戶要求時間
                </label>
                <Input
                  value={formData.customerRequestedTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerRequestedTime: e.target.value }))}
                  placeholder="例如: 3-5個工作日"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                備註
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="其他備註信息..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/work-orders')}
            disabled={createMutation.isPending}
          >
            取消
          </Button>
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
        </div>
      </form>
    </div>
  )
}
