/**
 * Work Order Create Page
 * 
 * Simple form to create a new work order.
 * Demonstrates end-to-end functionality before building complex forms.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateWorkOrder } from '@/lib/queries/work-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function CreateWorkOrderPage() {
  const router = useRouter()
  const createMutation = useCreateWorkOrder()
  
  const [formData, setFormData] = useState({
    jobNumber: '',
    customerName: '',
    workDescription: '',
    personInChargeId: '', // Will need to select from users
    workType: 'PACKAGING' as const,
    expectedCompletionDate: '',
    productionQuantity: '',
    notes: ''
  })
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    try {
      const payload: any = {
        jobNumber: formData.jobNumber,
        customerName: formData.customerName,
        workDescription: formData.workDescription,
        workType: formData.workType,
        notes: formData.notes || undefined
      }
      
      // Only add optional fields if they have values
      if (formData.personInChargeId) {
        payload.personInChargeId = formData.personInChargeId
      }
      if (formData.expectedCompletionDate) {
        payload.expectedCompletionDate = new Date(formData.expectedCompletionDate).toISOString()
      }
      if (formData.productionQuantity) {
        payload.productionQuantity = parseInt(formData.productionQuantity)
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
    <div className="container mx-auto py-8 px-4">
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
          創建新的工作單記錄
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

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Expected Completion Date */}
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

            {/* Production Quantity */}
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

            {/* Person In Charge - Placeholder */}
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <p className="text-sm text-warning-800">
                ⚠️ <strong>注意:</strong> 負責人選擇功能將在下一階段實現。目前此欄位為可選。
              </p>
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
                <strong>當前狀態:</strong> 簡化表單 (測試版)
              </p>
              <p className="text-neutral-700">
                <strong>待實現:</strong> 負責人下拉選擇、膠囊訂單關聯、高級驗證
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
