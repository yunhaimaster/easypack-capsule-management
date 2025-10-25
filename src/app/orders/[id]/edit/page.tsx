'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ProductionOrderForm } from '@/components/forms/production-order-form'
import { ProductionOrder } from '@/types'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { OrderLockDialog } from '@/components/orders/order-lock-dialog'
import { useAuth } from '@/components/auth/auth-provider'

export default function EditOrderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [order, setOrder] = useState<ProductionOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordVerifyDialog, setShowPasswordVerifyDialog] = useState(false)
  const [verificationToken, setVerificationToken] = useState<string | null>(searchParams.get('token'))

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch order')
        const data = await response.json()
        setOrder(data)
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const handlePasswordVerifySuccess = (password?: string) => {
    if (password) {
      const token = btoa(password)
      setVerificationToken(token)
    }
    setShowPasswordVerifyDialog(false)
  }

  const checkPasswordRequired = () => {
    if (!order) return false
    
    // 檢查是否有客戶指定的原料
    const hasCustomerProvidedIngredients = order.ingredients?.some(ingredient => ingredient.isCustomerProvided)
    
    // 如果有客戶指定原料且有密碼且非 Admin，需要密碼驗證
    return hasCustomerProvidedIngredients && order.lockPassword && !isAdmin && !verificationToken
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600 dark:text-white/75 text-sm">找不到指定的訂單</p>
      </div>
    )
  }


  return (
    <div className="min-h-screen brand-logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      
      {/* Main Content with padding for fixed nav and sticky action bar */}
      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-16 lg:px-20 xl:px-24 space-y-8 floating-combined content-with-sticky-actions">
        {/* Form Card */}
        <div className="max-w-5xl mx-auto w-full px-2 sm:px-4 md:px-0">
          <ProductionOrderForm 
            initialData={{
              customerName: order.customerName,
              productName: order.productName,
              productionQuantity: order.productionQuantity,
              completionDate: order.completionDate ? 
                (order.completionDate instanceof Date ? 
                  order.completionDate.toISOString().split('T')[0] : 
                  order.completionDate) : '',
              processIssues: order.processIssues,
              qualityNotes: order.qualityNotes,
              capsuleColor: order.capsuleColor,
              capsuleSize: order.capsuleSize as "#1" | "#0" | "#00" | null,
              capsuleType: order.capsuleType as "明膠胃溶" | "植物胃溶" | "明膠腸溶" | "植物腸溶" | null,
              customerService: order.customerService ?? '',
              actualProductionQuantity: order.actualProductionQuantity ?? undefined,
              materialYieldQuantity: order.materialYieldQuantity ?? undefined,
              ingredients: order.ingredients.map((ingredient) => ({
                ...ingredient,
                isCustomerProvided: ingredient.isCustomerProvided ?? true,
                isCustomerSupplied: ingredient.isCustomerSupplied ?? true
              })),
              worklogs: order.worklogs?.map((log) => ({
                id: log.id,
                workDate: typeof log.workDate === 'string' ? log.workDate.slice(0, 10) : new Date(log.workDate).toISOString().slice(0, 10),
                headcount: log.headcount,
                startTime: log.startTime,
                endTime: log.endTime,
                notes: log.notes || ''
              })) || []
            }}
            orderId={order.id}
            verificationToken={verificationToken}
            onPasswordRequired={() => setShowPasswordVerifyDialog(true)}
            needsPasswordVerification={checkPasswordRequired() || false}
          />
        </div>
      </div>
      
      {/* Password Verify Dialog */}
      <OrderLockDialog
        open={showPasswordVerifyDialog}
        onOpenChange={setShowPasswordVerifyDialog}
        mode="verify"
        orderId={order.id}
        onSuccess={handlePasswordVerifySuccess}
      />
    </div>
  )
}
