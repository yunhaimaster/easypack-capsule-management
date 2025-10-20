'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productionOrderSchema, worklogSchema, type ProductionOrderFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Info, Loader2, Upload, ArrowLeft, History } from 'lucide-react'
import { FieldTranslator } from '@/components/ui/field-translator'
import { SmartRecipeImport } from '@/components/forms/smart-recipe-import'
import { formatNumber, formatIngredientWeight, convertWeight, calculateBatchWeight, copyToClipboard } from '@/lib/utils'
import { calculateWorkUnits } from '@/lib/worklog'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast-provider'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { useSaveShortcut } from '@/hooks/use-keyboard-shortcut'
import { useDirtyForm } from '@/hooks/use-dirty-form'
import { useImportReview } from '@/hooks/use-import-review'

interface ProductionOrderFormProps {
  initialData?: Partial<ProductionOrderFormData>
  orderId?: string
  verificationToken?: string | null
  onPasswordRequired?: () => void
  needsPasswordVerification?: boolean
  allowEditProductName?: boolean // 🆕 是否允许编辑产品名称
  templateInfo?: {              // 🆕 模板信息
    recipeName: string
    originalProductName: string
  }
}

export function ProductionOrderForm({ initialData, orderId, verificationToken, onPasswordRequired, needsPasswordVerification, allowEditProductName = false, templateInfo }: ProductionOrderFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasStartedTyping, setHasStartedTyping] = useState(false)
  const pendingSubmitData = useRef<ProductionOrderFormData | null>(null)
  const { openReview, drawer } = useImportReview()

  // 處理產品名字的智能預填
  const handleProductNameFocus = () => {
    if (!hasStartedTyping && watch('productName') === '未命名產品') {
      setValue('productName', '')
      setHasStartedTyping(true)
    }
  }

  const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasStartedTyping) {
      setHasStartedTyping(true)
    }
  }

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue
  } = useForm<ProductionOrderFormData>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      customerName: initialData?.customerName || '',
      productName: initialData?.productName || '未命名產品',
      productionQuantity: initialData?.productionQuantity || 1,
      completionDate: initialData?.completionDate || '',
      processIssues: initialData?.processIssues || '',
      qualityNotes: initialData?.qualityNotes || '',
      capsuleColor: initialData?.capsuleColor || '',
      capsuleSize: initialData?.capsuleSize || null,
      capsuleType: initialData?.capsuleType || null,
      customerService: initialData?.customerService || '',
      actualProductionQuantity: initialData?.actualProductionQuantity ?? undefined,
      materialYieldQuantity: initialData?.materialYieldQuantity ?? undefined,
      ingredients: initialData?.ingredients?.map(ingredient => ({
        ...ingredient,
        isCustomerProvided: ingredient.isCustomerProvided ?? false,
        isCustomerSupplied: ingredient.isCustomerSupplied ?? false
      })) || [
        { materialName: '', unitContentMg: 0, isCustomerProvided: false, isCustomerSupplied: false }
      ],
      worklogs: (initialData?.worklogs as any[])?.map((log) => ({
        ...log,
        workDate: typeof log.workDate === 'string'
          ? log.workDate
          : log.workDate instanceof Date
            ? log.workDate.toISOString().split('T')[0]
            : new Date(log.workDate).toISOString().split('T')[0],
        notes: log.notes || ''
      })) || []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients'
  })

  const { fields: worklogFields, append: appendWorklog, remove: removeWorklog, update: updateWorklog } = useFieldArray({ control, name: 'worklogs' })

  const watchedIngredients = watch('ingredients')

  const watchedQuantity = watch('productionQuantity')

  // Initialize form instance for hooks
  const form = { register, control, handleSubmit, watch, formState: { errors }, setValue }

  // Track dirty state (unsaved changes)
  const initialFormData: ProductionOrderFormData = {
    customerName: initialData?.customerName || '',
    productName: initialData?.productName || '未命名產品',
    productionQuantity: initialData?.productionQuantity || 1,
    completionDate: initialData?.completionDate || '',
    processIssues: initialData?.processIssues || '',
    qualityNotes: initialData?.qualityNotes || '',
    capsuleColor: initialData?.capsuleColor || '',
    capsuleSize: initialData?.capsuleSize || null,
    capsuleType: initialData?.capsuleType || null,
    customerService: initialData?.customerService || '',
    actualProductionQuantity: initialData?.actualProductionQuantity ?? undefined,
    materialYieldQuantity: initialData?.materialYieldQuantity ?? undefined,
    ingredients: initialData?.ingredients?.map(ingredient => ({
      ...ingredient,
      isCustomerProvided: ingredient.isCustomerProvided ?? false,
      isCustomerSupplied: ingredient.isCustomerSupplied ?? false
    })) || [
      { materialName: '', unitContentMg: 0, isCustomerProvided: false, isCustomerSupplied: false }
    ],
    worklogs: (initialData?.worklogs as any[])?.map((log) => ({
      ...log,
      workDate: typeof log.workDate === 'string'
        ? log.workDate
        : log.workDate instanceof Date
          ? log.workDate.toISOString().split('T')[0]
          : new Date(log.workDate).toISOString().split('T')[0],
      notes: log.notes || ''
    })) || []
  }

  const { isDirty, resetDirty } = useDirtyForm(form as any, initialFormData)

  // Unified save handler for both keyboard shortcut and save button
  const handleSave = async () => {
    if (isSubmitting) return
    
    // Use handleSubmit to trigger form validation and submission
    const submitHandler = handleSubmit(onSubmit)
    await submitHandler()
  }

  // Keyboard shortcut for save (Cmd+S / Ctrl+S)
  useSaveShortcut(handleSave, !isSubmitting)

  // 計算單粒總重量
  const unitTotalWeight = watchedIngredients.reduce(
    (sum, ingredient) => {
      const weight = Number(ingredient.unitContentMg) || 0
      return sum + weight
    },
    0
  )

  // 計算批次總重量
  const batchTotalWeight = unitTotalWeight * (watchedQuantity || 1)

  // 檢測是否修改了受保護的字段（客戶指定的原料）
  const hasModifiedProtectedFields = (data: ProductionOrderFormData): boolean => {
    if (!initialData?.ingredients || !orderId) {
      return false // 新建訂單或無原料，不需要密碼
    }

    // 檢查是否修改了客戶指定的原料
    const originalCustomerIngredients = initialData.ingredients.filter(ing => ing.isCustomerProvided)
    const newCustomerIngredients = data.ingredients.filter(ing => ing.isCustomerProvided)

    // 比較數量
    if (originalCustomerIngredients.length !== newCustomerIngredients.length) {
      return true
    }

    // 比較每個客戶指定原料的內容
    for (let i = 0; i < originalCustomerIngredients.length; i++) {
      const original = originalCustomerIngredients[i]
      const current = newCustomerIngredients[i]
      
      if (
        original.materialName !== current.materialName ||
        original.unitContentMg !== current.unitContentMg ||
        original.isCustomerSupplied !== current.isCustomerSupplied
      ) {
        return true
      }
    }

    return false
  }

  // 當密碼驗證成功時，自動提交待處理的數據
  useEffect(() => {
    if (verificationToken && pendingSubmitData.current) {
      const dataToSubmit = pendingSubmitData.current
      pendingSubmitData.current = null
      submitOrder(dataToSubmit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationToken])

  // 實際提交訂單的函數
  const submitOrder = async (data: ProductionOrderFormData) => {
    setIsSubmitting(true)
    try {
      const url = orderId ? `/api/orders/${orderId}` : '/api/orders'
      const method = orderId ? 'PUT' : 'POST'

      const payload = {
        ...data,
        verificationPassword: verificationToken ? atob(verificationToken) : undefined,
        worklogs: data.worklogs?.map((entry) => {
          const parsed = worklogSchema.parse(entry)
          const { minutes, units } = calculateWorkUnits({ date: parsed.workDate, startTime: parsed.startTime, endTime: parsed.endTime, headcount: Number(parsed.headcount) })
          return { ...parsed, workDate: parsed.workDate, effectiveMinutes: minutes, calculatedWorkUnits: units }
        })
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        
        // 處理密碼驗證錯誤
        if (errorData.error === '密碼錯誤' || errorData.error === '需要密碼驗證') {
          showToast({
            title: '驗證失敗',
            description: '密碼已過期，請重新驗證',
            variant: 'destructive'
          })
          router.push(`/orders/${orderId}`)
          return
        }
        
        throw new Error(`儲存失敗: ${errorData.error || '未知錯誤'}`)
      }

      await response.json()

      // Reset dirty state after successful save
      resetDirty()

      showToast({
        title: orderId ? '訂單已更新' : '訂單已建立',
        description: orderId ? '訂單資料更新完成。' : '新的訂單已成功建立。'
      })
      router.push('/orders')
      router.refresh()
    } catch (error) {
      console.error('Error saving order:', error)
      const errorMessage = error instanceof Error ? error.message : '儲存失敗，請重試'
      showToast({
        title: '儲存失敗',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 表單提交入口
  const onSubmit = async (data: ProductionOrderFormData) => {
    // 檢查是否修改了受保護的字段（客戶指定的原料）
    const modifiedProtectedFields = hasModifiedProtectedFields(data)
    
    // 只有在修改了受保護字段且有密碼保護時才需要驗證
    if (modifiedProtectedFields && needsPasswordVerification && !verificationToken) {
      // 保存待提交的數據
      pendingSubmitData.current = data
      
      showToast({
        title: '需要密碼驗證',
        description: '您正在修改客戶指定的配方，請輸入密碼以繼續',
        variant: 'default'
      })
      
      if (onPasswordRequired) {
        onPasswordRequired()
      }
      return
    }

    // 如果不需要密碼驗證，或者只修改了非受保護字段，直接提交
    await submitOrder(data)
  }


  const handleSmartImport = (importedIngredients: any[]) => {
    try {
      // 驗證導入的原料數據
      if (!Array.isArray(importedIngredients)) {
        throw new Error('導入數據格式不正確')
      }
      
      // 初始原料：預設為客戶提供
      const newIngredients = importedIngredients.length > 0
        ? importedIngredients
            .map((ing, index) => {
              const materialName = String(ing.materialName || '').trim()
              const unitContentMg = Number(ing.unitContentMg) || 0
              
              if (!materialName) {
                console.warn(`第 ${index + 1} 個原料名稱為空，跳過`)
                return null
              }
              
              return {
                materialName,
                unitContentMg: Math.max(0, unitContentMg),
                // 導入的配方原料預設視為客戶提供
                isCustomerProvided: true,
                isCustomerSupplied: ing.isCustomerSupplied ?? false
              }
            })
            .filter((item): item is { materialName: string; unitContentMg: number; isCustomerProvided: boolean; isCustomerSupplied: boolean } => item !== null)
        : [{ materialName: '', unitContentMg: 0, isCustomerProvided: false, isCustomerSupplied: false }]
      
      // 使用 setValue 設置表單值，觸發重新渲染
      setValue('ingredients', newIngredients, { 
        shouldValidate: true,
        shouldDirty: true 
      })
      
      showToast({
        title: '原料已導入',
        description: '智能解析的原料已套用到表單。'
      })
      
    } catch (error) {
      console.error('導入原料時發生錯誤:', error)
      showToast({
        title: '導入失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    }
  }

  const addWorklog = () => {
    appendWorklog({ workDate: new Date().toISOString().slice(0, 10), headcount: 1, startTime: '08:30', endTime: '17:30', notes: '' })
  }

  const calculateWorklogSummary = (index: number) => {
    const entry = watch(`worklogs.${index}`)
    const headcountNumber = Number(entry?.headcount ?? 0)
    if (!entry?.workDate || !entry?.startTime || !entry?.endTime || headcountNumber <= 0 || Number.isNaN(headcountNumber)) {
      return null
    }
    const { units } = calculateWorkUnits({ date: entry.workDate, startTime: entry.startTime, endTime: entry.endTime, headcount: headcountNumber })
    return units
  }

  if (isSubmitting) {
    return (
      <div className="space-y-6 skeleton-stagger">
          {/* Basic Info Skeleton */}
          <Card className="liquid-glass-card liquid-glass-card-subtle">
            <CardHeader>
              <div className="skeleton skeleton-title"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="skeleton skeleton-text-sm"></div>
                  <div className="skeleton skeleton-form-field"></div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton skeleton-text-sm"></div>
                  <div className="skeleton skeleton-form-field"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Capsule Specs Skeleton */}
          <Card className="liquid-glass-card liquid-glass-card-subtle">
            <CardHeader>
              <div className="skeleton skeleton-title"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="skeleton skeleton-form-field"></div>
                <div className="skeleton skeleton-form-field"></div>
                <div className="skeleton skeleton-form-field"></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Ingredients Skeleton */}
          <Card className="liquid-glass-card liquid-glass-card-subtle">
            <CardHeader>
              <div className="skeleton skeleton-title"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="skeleton skeleton-form-field"></div>
                <div className="skeleton skeleton-form-field"></div>
                <div className="skeleton skeleton-form-field"></div>
              </div>
            </CardContent>
          </Card>
        </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-32">
      {/* 基本資訊 */}
        <div className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction">
          <div className="liquid-glass-content">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-cyan-500 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
                <span style={{ color: '#2a588c' }}>基本資訊</span>
              </h2>
            </div>
          </div>
          <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">客戶名稱 *</Label>
              <div className="flex gap-2">
                <Input
                  id="customerName"
                  {...register('customerName')}
                  placeholder="請輸入客戶名稱"
                  className="flex-1 form-focus-effect input-micro-focus"
                />
                <FieldTranslator
                  value={watch('customerName') || ''}
                  onTranslate={(translatedText) => setValue('customerName', translatedText)}
                />
              </div>
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">產品名字 *</Label>
              <div className="flex gap-2">
                <Input
                  id="productName"
                  {...register('productName')}
                  placeholder="請輸入產品名字"
                  disabled={!allowEditProductName && !!initialData?.productName} // 🆕 根据 prop 控制
                  onFocus={handleProductNameFocus}
                  onChange={(e) => {
                    handleProductNameChange(e)
                    register('productName').onChange(e)
                  }}
                  className="flex-1"
                />
                <FieldTranslator
                  value={watch('productName') || ''}
                  onTranslate={(translatedText) => setValue('productName', translatedText)}
                />
              </div>
              {/* 🆕 添加提示信息 */}
              {allowEditProductName && templateInfo && (
                <p className="text-xs text-primary-600">
                  💡 基于模板「{templateInfo.recipeName}」，可修改产品名称
                </p>
              )}
              {errors.productName && (
                <p className="text-sm text-destructive">{errors.productName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerService">客服 *</Label>
              <Input
                id="customerService"
                {...register('customerService')}
                placeholder="請輸入客服姓名"
                className="flex-1 form-focus-effect input-micro-focus"
              />
              {errors.customerService && (
                <p className="text-sm text-destructive">{errors.customerService.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productionQuantity">訂單數量 *</Label>
              <Input
                id="productionQuantity"
                type="number"
                {...register('productionQuantity', { valueAsNumber: true })}
                placeholder="請輸入訂單數量"
                min="1"
                max="5000000"
              />
              {errors.productionQuantity && (
                <p className="text-sm text-destructive">{errors.productionQuantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualProductionQuantity">實際生產數量 (粒)</Label>
              <Input
                id="actualProductionQuantity"
                type="number"
                {...register('actualProductionQuantity', {
                  setValueAs: (value) => {
                    if (value === '' || value === null || value === undefined) return undefined
                    const parsed = Number(value)
                    return Number.isNaN(parsed) ? undefined : parsed
                  }
                })}
                placeholder="包裝完成後填寫"
                min="0"
              />
              {errors.actualProductionQuantity && (
                <p className="text-sm text-destructive">{errors.actualProductionQuantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialYieldQuantity">材料可做數量 (粒)</Label>
              <Input
                id="materialYieldQuantity"
                type="number"
                {...register('materialYieldQuantity', {
                  setValueAs: (value) => {
                    if (value === '' || value === null || value === undefined) return undefined
                    const parsed = Number(value)
                    return Number.isNaN(parsed) ? undefined : parsed
                  }
                })}
                placeholder="材料實際可生產數量"
                min="0"
              />
              {errors.materialYieldQuantity && (
                <p className="text-sm text-destructive">{errors.materialYieldQuantity.message}</p>
              )}
            </div>
          </div>
          </div>
        </div>

      {/* 工時紀錄 */}
      <div className="liquid-glass-card liquid-glass-card-elevated liquid-glass-card-refraction">
        <div className="liquid-glass-content">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2a1 1 0 102 0V6h1v2a1 1 0 102 0V6h6v2a1 1 0 102 0V6h1v2a1 1 0 102 0V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 11a1 1 0 000 2h1v4a1 1 0 102 0v-4h6v4a1 1 0 102 0v-4h1a1 1 0 100-2H4z" />
                </svg>
              </div>
              <span style={{ color: '#2a588c' }}>工時紀錄</span>
            </h2>
            <Button type="button" onClick={addWorklog} className="ripple-effect btn-micro-hover bg-amber-500 hover:bg-amber-600">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> 新增工時
            </Button>
          </div>
        </div>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-600 bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2">
            <Info className="h-4 w-4" aria-hidden="true" />
            <p>系統自動扣除 12:30-13:30 午餐時間，並以 0.5 工時為單位向上取整後乘以人數。</p>
          </div>
          {worklogFields.length === 0 ? (
            <p className="text-sm text-neutral-500">暫未新增工時紀錄，點擊「新增工時」加入第一筆。</p>
          ) : (
            <div className="space-y-4">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>人數</TableHead>
                      <TableHead>開始時間</TableHead>
                      <TableHead>結束時間</TableHead>
                      <TableHead>備註</TableHead>
                      <TableHead className="text-right">當日工時 (工時)</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {worklogFields.map((field, index) => {
                      const summary = calculateWorklogSummary(index)
                      const errorPrefix = errors.worklogs?.[index] as any
                      return (
                        <TableRow key={field.id}>
                          <TableCell className="min-w-[140px]">
                            <Controller
                              control={control}
                              name={`worklogs.${index}.workDate` as const}
                              render={({ field: controllerField }) => (
                                <Input
                                  type="date"
                                  className="form-focus-effect"
                                  value={controllerField.value || ''}
                                  onChange={controllerField.onChange}
                                />
                              )}
                            />
                            {errorPrefix?.workDate && (
                              <p className="text-xs text-destructive mt-1">{errorPrefix.workDate.message as string}</p>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            <Controller
                              control={control}
                              name={`worklogs.${index}.headcount` as const}
                              render={({ field: controllerField }) => (
                                <Input
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={controllerField.value ?? 1}
                                  onChange={(e) => {
                                    const raw = e.target.value
                                    controllerField.onChange(raw === '' ? '' : Number(raw))
                                  }}
                                />
                              )}
                            />
                            {errorPrefix?.headcount && (
                              <p className="text-xs text-destructive mt-1">{errorPrefix.headcount.message as string}</p>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            <Controller
                              control={control}
                              name={`worklogs.${index}.startTime` as const}
                              render={({ field: controllerField }) => (
                                <Input
                                  type="time"
                                  value={controllerField.value || ''}
                                  onChange={controllerField.onChange}
                                />
                              )}
                            />
                            {errorPrefix?.startTime && (
                              <p className="text-xs text-destructive mt-1">{errorPrefix.startTime.message as string}</p>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[120px]">
                            <Controller
                              control={control}
                              name={`worklogs.${index}.endTime` as const}
                              render={({ field: controllerField }) => (
                                <Input
                                  type="time"
                                  value={controllerField.value || ''}
                                  onChange={controllerField.onChange}
                                />
                              )}
                            />
                            {errorPrefix?.endTime && (
                              <p className="text-xs text-destructive mt-1">{errorPrefix.endTime.message as string}</p>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[220px]">
                            <Controller
                              control={control}
                              name={`worklogs.${index}.notes` as const}
                              render={({ field: controllerField }) => (
                                <Input
                                  placeholder="可填寫內容摘要"
                                  value={controllerField.value || ''}
                                  onChange={controllerField.onChange}
                                  className="w-full min-w-[160px]"
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold text-neutral-800">
                            {summary != null && typeof summary === 'number' ? summary.toFixed(1) : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeWorklog(index)}>
                              <Trash2 className="h-4 w-4 text-danger-500" aria-hidden="true" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-5">
                {worklogFields.map((field, index) => {
                  const summary = calculateWorklogSummary(index)
                  const errorPrefix = errors.worklogs?.[index] as any
                  return (
                    <div key={field.id} className="p-5 rounded-2xl bg-white/75 backdrop-blur-sm border border-white/50 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-neutral-700">工時 #{index + 1}</div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeWorklog(index)}>
                          <Trash2 className="h-4 w-4 text-danger-500" aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-500">日期</Label>
                          <Controller
                            control={control}
                            name={`worklogs.${index}.workDate` as const}
                            render={({ field: controllerField }) => (
                              <Input
                                type="date"
                                value={controllerField.value || ''}
                                onChange={controllerField.onChange}
                              />
                            )}
                          />
                          {errorPrefix?.workDate && <p className="text-xs text-destructive mt-1">{errorPrefix.workDate.message as string}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-500">人數</Label>
                          <Controller
                            control={control}
                            name={`worklogs.${index}.headcount` as const}
                            render={({ field: controllerField }) => (
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                value={controllerField.value ?? 1}
                                onChange={(e) => {
                                  const raw = e.target.value
                                  controllerField.onChange(raw === '' ? '' : Number(raw))
                                }}
                              />
                            )}
                          />
                          {errorPrefix?.headcount && <p className="text-xs text-destructive mt-1">{errorPrefix.headcount.message as string}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-neutral-500">開始</Label>
                            <Controller
                              control={control}
                              name={`worklogs.${index}.startTime` as const}
                              render={({ field: controllerField }) => (
                                <Input
                                  type="time"
                                  value={controllerField.value || ''}
                                  onChange={controllerField.onChange}
                                />
                              )}
                            />
                            {errorPrefix?.startTime && <p className="text-xs text-destructive mt-1">{errorPrefix.startTime.message as string}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-neutral-500">結束</Label>
                            <Controller
                              control={control}
                              name={`worklogs.${index}.endTime` as const}
                              render={({ field: controllerField }) => (
                                <Input
                                  type="time"
                                  value={controllerField.value || ''}
                                  onChange={controllerField.onChange}
                                />
                              )}
                            />
                            {errorPrefix?.endTime && <p className="text-xs text-destructive mt-1">{errorPrefix.endTime.message as string}</p>}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-500">備註</Label>
                          <Controller
                            control={control}
                            name={`worklogs.${index}.notes` as const}
                            render={({ field: controllerField }) => (
                              <Input
                                placeholder="可填寫內容摘要"
                                value={controllerField.value || ''}
                                onChange={controllerField.onChange}
                              />
                            )}
                          />
                        </div>
                        <div className="text-right text-sm font-semibold text-neutral-700">
                          當日工時：{summary != null && typeof summary === 'number' ? summary.toFixed(1) : '—'} 工時
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </div>

      {/* 膠囊規格 */}
        <div className="liquid-glass-card liquid-glass-card-elevated liquid-glass-card-refraction">
          <div className="liquid-glass-content">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <span style={{ color: '#2a588c' }}>膠囊規格</span>
              </h2>
            </div>
          </div>
          <div className="px-6 pb-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capsuleColor">膠囊顏色</Label>
              <Input
                id="capsuleColor"
                {...register('capsuleColor')}
                placeholder="例如：白色、透明、藍色"
              />
              {errors.capsuleColor && (
                <p className="text-sm text-destructive">{errors.capsuleColor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capsuleSize">膠囊大小</Label>
              <Select 
                value={watch('capsuleSize') || ''} 
                onValueChange={(value) => setValue('capsuleSize', value as "#1" | "#0" | "#00")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇膠囊大小" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#1">#1</SelectItem>
                  <SelectItem value="#0">#0</SelectItem>
                  <SelectItem value="#00">#00</SelectItem>
                </SelectContent>
              </Select>
              {errors.capsuleSize && (
                <p className="text-sm text-destructive">{errors.capsuleSize.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capsuleType">膠囊成份</Label>
              <Select 
                value={watch('capsuleType') || ''} 
                onValueChange={(value) => setValue('capsuleType', value as "明膠胃溶" | "植物胃溶" | "明膠腸溶" | "植物腸溶")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇膠囊成份" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="明膠胃溶">明膠胃溶</SelectItem>
                  <SelectItem value="植物胃溶">植物胃溶</SelectItem>
                  <SelectItem value="明膠腸溶">明膠腸溶</SelectItem>
                  <SelectItem value="植物腸溶">植物腸溶</SelectItem>
                </SelectContent>
              </Select>
              {errors.capsuleType && (
                <p className="text-sm text-destructive">{errors.capsuleType.message}</p>
              )}
            </div>
          </div>
          </div>
        </div>

      {/* 其他信息 */}
      <div className="rounded-2xl border border-white/40 bg-white/85 backdrop-blur-sm shadow-sm">
        <div className="px-6 pt-6 pb-2 flex items-center gap-2 text-lg sm:text-xl font-semibold text-[--brand-neutral]">
          <span className="text-green-600">📋</span>
          其他信息
        </div>
        <div className="px-6 pb-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="completionDate">完工日期</Label>
            <Controller
              name="completionDate"
              control={control}
              render={({ field }) => (
                <Input
                  id="completionDate"
                  type="date"
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || '')}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="processIssues">製程問題記錄</Label>
            <textarea
              id="processIssues"
              {...register('processIssues')}
              placeholder="記錄生產異常與解決方案"
              className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {errors.processIssues && (
              <p className="text-sm text-destructive">{errors.processIssues.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="qualityNotes">品管備註</Label>
            <textarea
              id="qualityNotes"
              {...register('qualityNotes')}
              placeholder="品管相關備註"
              className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {errors.qualityNotes && (
              <p className="text-sm text-destructive">{errors.qualityNotes.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 原料配方 */}
      <div className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction">
        <div className="liquid-glass-content">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-success-500 to-teal-500 rounded-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                  </svg>
                </div>
                <span style={{ color: '#2a588c' }}>原料配方（每粒規格）</span>
              </h2>
              <div className="flex gap-2 flex-wrap">
                <SmartRecipeImport 
                  onImport={(imported) => {
                    try {
                      const importedList = (imported || []).map((ing: any) => ({
                        materialName: String(ing.materialName || '').trim(),
                        unitContentMg: Number(ing.unitContentMg) || 0
                      })).filter((i: any) => i.materialName)

                      const currentList = (watch('ingredients') || []).map((ing: any) => ({
                        materialName: String(ing.materialName || '').trim(),
                        unitContentMg: Number(ing.unitContentMg) || 0
                      }))

                      openReview(importedList, currentList, (merged) => {
                        import('@/lib/import/merge').then(({ normalizeIngredientName }) => {
                          const flagsByName = new Map<string, { isCustomerProvided: boolean; isCustomerSupplied: boolean }>()
                          ;(watch('ingredients') || []).forEach((ing: any) => {
                            flagsByName.set(normalizeIngredientName(ing.materialName), {
                              isCustomerProvided: Boolean(ing.isCustomerProvided),
                              isCustomerSupplied: Boolean(ing.isCustomerSupplied)
                            })
                          })
                          const mergedWithFlags = (merged as any[]).map((m: any) => {
                            const key = normalizeIngredientName(m.materialName)
                            const flags = flagsByName.get(key) || { isCustomerProvided: true, isCustomerSupplied: false }
                            return { ...m, ...flags }
                          })
                          setValue('ingredients', mergedWithFlags, { shouldValidate: true, shouldDirty: true })
                          showToast({ title: '已套用導入', description: `已更新 ${merged.length} 項原料。` })
                        }).catch(() => {
                          setValue('ingredients', merged as any, { shouldValidate: true, shouldDirty: true })
                        })
                      })
                    } catch (e) {
                      handleSmartImport(imported)
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          {/* 桌面版表格 */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>原料品名 *</TableHead>
                  <TableHead>單粒含量 (mg) *</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div className="flex gap-2">
                        <Controller
                          name={`ingredients.${index}.materialName`}
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="原料品名"
                              className="flex-1"
                              autoComplete="off"
                              onChange={(e) => {
                                // 如果修改客戶指定的原料名稱，檢查是否需要密碼驗證
                                const isCustomerProvided = watch(`ingredients.${index}.isCustomerProvided`)
                                if (isCustomerProvided && needsPasswordVerification && !verificationToken) {
                                  if (onPasswordRequired) {
                                    onPasswordRequired()
                                    return // 不更新值，保持原狀
                                  }
                                }
                                field.onChange(e)
                              }}
                            />
                          )}
                        />
                        <FieldTranslator
                          value={watch(`ingredients.${index}.materialName`) || ''}
                          onTranslate={(translatedText) => setValue(`ingredients.${index}.materialName`, translatedText)}
                          className="shrink-0"
                        />
                      </div>
                      {errors.ingredients?.[index]?.materialName && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.ingredients[index]?.materialName?.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Controller
                          name={`ingredients.${index}.unitContentMg`}
                          control={control}
                          defaultValue={0}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              step="0.00001"
                              placeholder="0.00000"
                              onChange={(e) => {
                                // 如果修改客戶指定的原料含量，檢查是否需要密碼驗證
                                const isCustomerProvided = watch(`ingredients.${index}.isCustomerProvided`)
                                if (isCustomerProvided && needsPasswordVerification && !verificationToken) {
                                  if (onPasswordRequired) {
                                    onPasswordRequired()
                                    return // 不更新值，保持原狀
                                  }
                                }
                                field.onChange(parseFloat(e.target.value) || 0)
                              }}
                            />
                          )}
                        />
                        <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                          <Controller
                            name={`ingredients.${index}.isCustomerProvided`}
                            control={control}
                            defaultValue={true}
                            render={({ field }) => (
                              <label className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    const newValue = Boolean(checked)
                                    // 如果嘗試取消勾選客戶指定，檢查是否需要密碼驗證
                                    if (!newValue && field.value && needsPasswordVerification && !verificationToken) {
                                      if (onPasswordRequired) {
                                        onPasswordRequired()
                                        return // 不更新值，保持原狀
                                      }
                                    }
                                    field.onChange(newValue)
                                  }}
                                  className="h-4 w-4"
                                />
                                <span>客戶指定配方</span>
                              </label>
                            )}
                          />
                          <Controller
                            name={`ingredients.${index}.isCustomerSupplied`}
                            control={control}
                            defaultValue={true}
                            render={({ field }) => (
                              <label className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                                  className="h-4 w-4"
                                />
                                <span>客戶提供原料</span>
                              </label>
                            )}
                          />
                        </div>
                      </div>
                      {errors.ingredients?.[index]?.unitContentMg && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.ingredients[index]?.unitContentMg?.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // 如果嘗試刪除客戶指定的原料，檢查是否需要密碼驗證
                          const isCustomerProvided = watch(`ingredients.${index}.isCustomerProvided`)
                          if (isCustomerProvided && needsPasswordVerification && !verificationToken) {
                            if (onPasswordRequired) {
                              onPasswordRequired()
                              return // 不刪除，保持原狀
                            }
                          }
                          remove(index)
                        }}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 手機版卡片佈局 */}
          <div className="block md:hidden space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction border border-neutral-200">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base text-neutral-800">
                      原料 #{index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // 如果嘗試刪除客戶指定的原料，檢查是否需要密碼驗證
                        const isCustomerProvided = watch(`ingredients.${index}.isCustomerProvided`)
                        if (isCustomerProvided && needsPasswordVerification && !verificationToken) {
                          if (onPasswordRequired) {
                            onPasswordRequired()
                            return // 不刪除，保持原狀
                          }
                        }
                        remove(index)
                      }}
                      disabled={fields.length === 1}
                      className="touch-target"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* 原料品名 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">原料品名 *</Label>
                      <div className="flex gap-2">
                        <Controller
                          name={`ingredients.${index}.materialName`}
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="請輸入原料品名"
                              className="flex-1 h-11 text-base"
                              autoComplete="off"
                              onChange={(e) => {
                                // 如果修改客戶指定的原料名稱，檢查是否需要密碼驗證
                                const isCustomerProvided = watch(`ingredients.${index}.isCustomerProvided`)
                                if (isCustomerProvided && needsPasswordVerification && !verificationToken) {
                                  if (onPasswordRequired) {
                                    onPasswordRequired()
                                    return // 不更新值，保持原狀
                                  }
                                }
                                field.onChange(e)
                              }}
                            />
                          )}
                        />
                        <FieldTranslator
                          value={watch(`ingredients.${index}.materialName`) || ''}
                          onTranslate={(translatedText) => setValue(`ingredients.${index}.materialName`, translatedText)}
                          className="shrink-0"
                        />
                      </div>
                      {errors.ingredients?.[index]?.materialName && (
                        <p className="text-sm text-destructive">
                          {errors.ingredients[index]?.materialName?.message}
                        </p>
                      )}
                    </div>

                    {/* 單粒含量、原料來源 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">單粒含量 (mg) *</Label>
                      <Controller
                        name={`ingredients.${index}.unitContentMg`}
                        control={control}
                        defaultValue={0}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            step="0.00001"
                            placeholder="0.00000"
                            className="w-full h-11 text-base"
                            autoComplete="off"
                            onChange={(e) => {
                              // 如果修改客戶指定的原料含量，檢查是否需要密碼驗證
                              const isCustomerProvided = watch(`ingredients.${index}.isCustomerProvided`)
                              if (isCustomerProvided && needsPasswordVerification && !verificationToken) {
                                if (onPasswordRequired) {
                                  onPasswordRequired()
                                  return // 不更新值，保持原狀
                                }
                              }
                              field.onChange(parseFloat(e.target.value) || 0)
                            }}
                          />
                        )}
                      />
                      {errors.ingredients?.[index]?.unitContentMg && (
                        <p className="text-sm text-destructive">
                          {errors.ingredients[index]?.unitContentMg?.message}
                        </p>
                      )}

                      <Controller
                        name={`ingredients.${index}.isCustomerProvided`}
                        control={control}
                        defaultValue={true}
                        render={({ field }) => (
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                const newValue = Boolean(checked)
                                // 如果嘗試取消勾選客戶指定，檢查是否需要密碼驗證
                                if (!newValue && field.value && needsPasswordVerification && !verificationToken) {
                                  if (onPasswordRequired) {
                                    onPasswordRequired()
                                    return // 不更新值，保持原狀
                                  }
                                }
                                field.onChange(newValue)
                              }}
                              className="h-4 w-4"
                            />
                            <span>客戶指定配方</span>
                          </label>
                        )}
                      />
                      <Controller
                        name={`ingredients.${index}.isCustomerSupplied`}
                        control={control}
                        defaultValue={true}
                        render={({ field }) => (
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                              className="h-4 w-4"
                            />
                            <span>客戶提供原料</span>
                          </label>
                        )}
                      />
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
            onClick={() => append({ materialName: '', unitContentMg: 0, isCustomerProvided: false, isCustomerSupplied: false })}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              新增原料
            </Button>
          </div>

          {errors.ingredients && (
            <p className="text-sm text-destructive mt-2">
              {errors.ingredients.message}
            </p>
          )}
        </div>
      </div>

      {/* 計算結果 */}
        <Card className="liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <span className="text-success-600">📊</span>
              計算結果
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-600 font-medium">單粒總重量</p>
              <p className="text-lg sm:text-xl font-semibold text-primary-800">
                {typeof unitTotalWeight === 'number' ? formatIngredientWeight(unitTotalWeight) : '0'} mg
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-lg border border-success-200">
              <p className="text-sm text-success-600 font-medium">批次總重量</p>
              <p className="text-lg sm:text-xl font-semibold text-success-800">
                {convertWeight(batchTotalWeight).display}
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">生產數量</p>
              <p className="text-lg sm:text-xl font-semibold text-purple-800">
                {formatNumber(watchedQuantity || 0)} 粒
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Action Bar replaces bottom buttons */}
      <StickyActionBar
        onSave={handleSave}
        onCancel={() => router.back()}
        isDirty={isDirty}
        isSaving={isSubmitting}
        saveLabel="儲存配方"
        cancelLabel="取消"
      />
      {drawer}
    </form>
  )
}