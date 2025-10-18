'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import type { RecipeLibraryItem } from '@/types'
import { cn } from '@/lib/utils'

// Zod Schema - 包括配方資訊和原料清單
const editRecipeSchema = z.object({
  recipeName: z.string().trim().min(1, '配方名稱不能為空').max(200, '配方名稱過長'),
  productName: z.string().trim().min(1, '產品名稱不能為空').max(200, '產品名稱過長'),
  description: z.string().optional().nullable(),
  capsuleSize: z.string().optional().nullable(),
  capsuleColor: z.string().optional().nullable(),
  capsuleType: z.string().optional().nullable(),
  // 🆕 原料清單
  ingredients: z.array(z.object({
    materialName: z.string().trim().min(1, '原料名稱不能為空'),
    unitContentMg: z.number().positive('含量必須大於 0')
  })).min(1, '至少需要一個原料')
})

type EditRecipeData = z.infer<typeof editRecipeSchema>

interface EditRecipeDialogProps {
  recipe: RecipeLibraryItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditRecipeDialog({
  recipe,
  open,
  onOpenChange,
  onSuccess
}: EditRecipeDialogProps) {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm<EditRecipeData>({
    resolver: zodResolver(editRecipeSchema),
    mode: 'onSubmit', // 只在提交時驗證
    defaultValues: {
      recipeName: recipe.recipeName,
      productName: recipe.productName,
      description: recipe.description || '',
      capsuleSize: recipe.capsuleSize || null,
      capsuleColor: recipe.capsuleColor || '',
      capsuleType: recipe.capsuleType || null,
      // 🆕 原料清單初始值
      ingredients: recipe.ingredients || []
    }
  })

  // 🆕 使用 useFieldArray 管理原料清單
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients'
  })

  const onSubmit = async (data: EditRecipeData) => {
    // eslint-disable-next-line no-console
    console.log('📝 開始保存配方，數據：', data)
    setSaving(true)
    
    try {
      // eslint-disable-next-line no-console
      console.log('🚀 發送 API 請求到：', `/api/recipes/${recipe.id}`)
      
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      // eslint-disable-next-line no-console
      console.log('📡 API 回應狀態：', response.status, response.statusText)
      
      const result = await response.json()
      // eslint-disable-next-line no-console
      console.log('📦 API 回應內容：', result)

      if (!response.ok || !result.success) {
        throw new Error(result.error || '保存失敗')
      }

      showToast({
        title: '保存成功',
        description: '配方資訊已更新'
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('❌ 保存配方失敗：', error)
      showToast({
        title: '保存失敗',
        description: error instanceof Error ? error.message : '未知錯誤',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-neutral-800">編輯模板配方</DialogTitle>
          <DialogDescription className="text-neutral-600">
            修改配方的基本資訊。生產配方不可編輯以保持歷史真實性。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(
          onSubmit,
          (errors) => {
            // eslint-disable-next-line no-console
            console.error('❌ 表單驗證失敗：', JSON.stringify(errors, null, 2))
            // eslint-disable-next-line no-console
            console.error('❌ 詳細錯誤：', Object.entries(errors).map(([field, err]) => `${field}: ${err?.message}`))
            const errorMessages = Object.entries(errors)
              .map(([field, err]) => `${field}: ${err?.message}`)
              .join('\n')
            showToast({
              title: '驗證失敗',
              description: errorMessages || '請檢查表單欄位是否正確填寫',
              variant: 'destructive'
            })
          }
        )} className="space-y-4">
          {/* 配方名稱 */}
          <div className="space-y-2">
            <Label htmlFor="recipeName" className="text-neutral-700">
              配方名稱 *
            </Label>
            <Input
              id="recipeName"
              {...register('recipeName')}
              placeholder="請輸入配方名稱"
              className="transition-apple"
            />
            {errors.recipeName && (
              <p className="text-sm text-danger-600">{errors.recipeName.message}</p>
            )}
          </div>

          {/* 產品名稱 */}
          <div className="space-y-2">
            <Label htmlFor="productName" className="text-neutral-700">
              產品名稱 *
            </Label>
            <Input
              id="productName"
              {...register('productName')}
              placeholder="請輸入產品名稱"
              className="transition-apple"
            />
            {errors.productName && (
              <p className="text-sm text-danger-600">{errors.productName.message}</p>
            )}
          </div>

          {/* 配方描述 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-neutral-700">
              配方描述
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="可選：添加配方描述"
              rows={3}
              className="transition-apple"
            />
            {errors.description && (
              <p className="text-sm text-danger-600">{errors.description.message}</p>
            )}
          </div>

          {/* 膠囊規格 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 膠囊大小 */}
            <div className="space-y-2">
              <Label htmlFor="capsuleSize" className="text-neutral-700">
                膠囊大小
              </Label>
              <Select
                value={watch('capsuleSize') || undefined}
                onValueChange={(value) => setValue('capsuleSize', value === 'none' ? null : value)}
              >
                <SelectTrigger className="transition-apple">
                  <SelectValue placeholder="選擇" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不選擇</SelectItem>
                  <SelectItem value="#1">#1</SelectItem>
                  <SelectItem value="#0">#0</SelectItem>
                  <SelectItem value="#00">#00</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 膠囊顏色 */}
            <div className="space-y-2">
              <Label htmlFor="capsuleColor" className="text-neutral-700">
                膠囊顏色
              </Label>
              <Input
                id="capsuleColor"
                {...register('capsuleColor')}
                placeholder="例如：白色"
                className="transition-apple"
              />
            </div>

            {/* 膠囊類型 */}
            <div className="space-y-2">
              <Label htmlFor="capsuleType" className="text-neutral-700">
                膠囊類型
              </Label>
              <Select
                value={watch('capsuleType') || undefined}
                onValueChange={(value) => setValue('capsuleType', value === 'none' ? null : value)}
              >
                <SelectTrigger className="transition-apple">
                  <SelectValue placeholder="選擇" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不選擇</SelectItem>
                  <SelectItem value="明膠胃溶">明膠胃溶</SelectItem>
                  <SelectItem value="植物胃溶">植物胃溶</SelectItem>
                  <SelectItem value="明膠腸溶">明膠腸溶</SelectItem>
                  <SelectItem value="植物腸溶">植物腸溶</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 🆕 原料清單編輯 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-neutral-700 text-base font-semibold">
                原料清單 *
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ materialName: '', unitContentMg: 0 })}
                className="flex items-center gap-1 transition-apple"
              >
                <Plus className="h-3 w-3" />
                添加原料
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-4 border border-dashed border-neutral-300 rounded-lg">
                尚未添加任何原料，點擊上方「添加原料」按鈕開始
              </p>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {/* 原料名稱 */}
                    <div className="col-span-2 sm:col-span-1">
                      <Input
                        {...register(`ingredients.${index}.materialName` as const)}
                        placeholder="原料名稱"
                        className={cn(
                          "transition-apple",
                          errors.ingredients?.[index]?.materialName && "border-danger-500"
                        )}
                      />
                      {errors.ingredients?.[index]?.materialName && (
                        <p className="text-xs text-danger-600 mt-1">
                          {errors.ingredients[index]?.materialName?.message}
                        </p>
                      )}
                    </div>

                    {/* 單位含量 */}
                    <div className="col-span-2 sm:col-span-1">
                      <Input
                        {...register(`ingredients.${index}.unitContentMg` as const, {
                          valueAsNumber: true
                        })}
                        type="number"
                        step="0.01"
                        placeholder="含量 (mg)"
                        className={cn(
                          "transition-apple",
                          errors.ingredients?.[index]?.unitContentMg && "border-danger-500"
                        )}
                      />
                      {errors.ingredients?.[index]?.unitContentMg && (
                        <p className="text-xs text-danger-600 mt-1">
                          {errors.ingredients[index]?.unitContentMg?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 刪除按鈕 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="h-10 w-10 p-0 text-danger-600 hover:bg-danger-50 transition-apple shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {errors.ingredients && typeof errors.ingredients.message === 'string' && (
              <p className="text-sm text-danger-600">{errors.ingredients.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="transition-apple"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary-500 hover:bg-primary-600 transition-apple"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

