'use client'

import { useActionState, useOptimistic, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productionOrderSchema } from '@/lib/validations'
import { createProductionOrder, updateProductionOrder } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { IconContainer } from '@/components/ui/icon-container'
import { Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { z } from 'zod'

type ProductionOrderFormData = z.infer<typeof productionOrderSchema>

interface ProductionOrderFormProps {
  initialData?: Partial<ProductionOrderFormData> & { id?: string }
  orderId?: string
  verificationToken?: string | null
  onPasswordRequired?: () => void
  needsPasswordVerification?: boolean
  allowEditProductName?: boolean
  templateInfo?: {
    recipeName: string
    originalProductName?: string
  }
  onSubmit?: () => void
  className?: string
}

const initialState = {
  message: '',
  errors: {} as Record<string, string[]>,
}

export function ProductionOrderForm({ 
  initialData, 
  orderId,
  verificationToken,
  onPasswordRequired,
  needsPasswordVerification,
  allowEditProductName,
  templateInfo,
  onSubmit,
  className 
}: ProductionOrderFormProps) {
  const [state, formAction, pending] = useActionState(
    initialData?.id ? updateProductionOrder : createProductionOrder,
    initialState
  )
  
  const [isPending, startTransition] = useTransition()
  const isSubmitting = pending || isPending

  // Optimistic updates for better UX
  const [optimisticData, addOptimistic] = useOptimistic(
    initialData,
    (state, newData: Partial<ProductionOrderFormData>) => ({
      ...state,
      ...newData,
    })
  )

  const form = useForm<ProductionOrderFormData>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      customerName: (initialData as any)?.customerName || '',
      productName: (initialData as any)?.productName || '',
      productionQuantity: (initialData as any)?.productionQuantity || 0,
      unitWeightMg: (initialData as any)?.unitWeightMg || 500,
      batchTotalWeightMg: (initialData as any)?.batchTotalWeightMg || 0,
      notes: (initialData as any)?.notes || '',
      customerService: (initialData as any)?.customerService || '',
    } as any,
  })

  const handleSubmit = (data: ProductionOrderFormData) => {
    // Optimistic update
    addOptimistic(data)
    
    startTransition(() => {
      const formData = new FormData()
      
      if (initialData?.id) {
        formData.append('orderId', initialData.id)
      }
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      formAction(formData)
    })
  }

  return (
    <Card className={cn('liquid-glass-card', className)}>
      <CardHeader className="liquid-glass-content">
        <CardTitle className="flex items-center gap-2">
          <IconContainer icon={Save} variant="primary" size="md" />
          {initialData?.id ? '編輯生產訂單' : '創建生產訂單'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="liquid-glass-content">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Display server-side errors */}
            {state.message && (
              <div className="p-4 rounded-lg bg-danger-50 border border-danger-200">
                <p className="text-danger-700 text-sm">{state.message}</p>
                {Object.entries(state.errors || {}).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {Object.entries(state.errors).map(([field, errors]) => (
                      <li key={field} className="text-danger-600 text-xs">
                        {field}: {errors.join(', ')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                          render={({ field }) => (
                  <FormItem>
                    <FormLabel>客戶名稱 *</FormLabel>
                    <FormControl>
                            <Input
                              {...field}
                        placeholder="請輸入客戶名稱"
                        disabled={isSubmitting}
                        className={cn(
                          'transition-apple',
                          isSubmitting && 'opacity-50'
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productName"
                          render={({ field }) => (
                  <FormItem>
                    <FormLabel>產品名稱 *</FormLabel>
                    <FormControl>
                            <Input
                              {...field}
                        placeholder="請輸入產品名稱"
                        disabled={isSubmitting}
                        className={cn(
                          'transition-apple',
                          isSubmitting && 'opacity-50'
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productionQuantity"
                        render={({ field }) => (
                  <FormItem>
                    <FormLabel>生產數量 *</FormLabel>
                    <FormControl>
                          <Input
                            {...field}
                            type="number"
                        min="1"
                        placeholder="請輸入生產數量"
                        disabled={isSubmitting}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className={cn(
                          'transition-apple',
                          isSubmitting && 'opacity-50'
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerService"
                        render={({ field }) => (
                  <FormItem>
                    <FormLabel>客服備註</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="客服備註（可選）"
                        disabled={isSubmitting}
                        className={cn(
                          'transition-apple',
                          isSubmitting && 'opacity-50'
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                        )}
                      />
                    </div>

            <FormField
              control={form.control}
              name="processIssues"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備註</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="請輸入備註（可選）"
                      disabled={isSubmitting}
                      rows={4}
                      className={cn(
                        'transition-apple resize-none',
                        isSubmitting && 'opacity-50'
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
            <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'bg-gradient-to-r from-primary-500 to-primary-600',
                  'hover:from-primary-600 hover:to-primary-700',
                  'transition-all duration-300 touch-feedback',
                  'min-w-[120px]',
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <IconContainer icon={Save} variant="neutral" size="sm" />
                    {initialData?.id ? '更新訂單' : '創建訂單'}
                  </>
                )}
            </Button>
            </div>
          </form>
        </Form>
        </CardContent>
      </Card>
  )
}