'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import type { RecipeLibraryItem } from '@/types'

// Zod Schema - 只驗證必填欄位：配方名稱和產品名稱
const editRecipeSchema = z.object({
  recipeName: z.string().trim().min(1, '配方名稱不能為空').max(200, '配方名稱過長'),
  productName: z.string().trim().min(1, '產品名稱不能為空').max(200, '產品名稱過長'),
  // 其他欄位都可以為空，不驗證
  description: z.string().optional().nullable(),
  capsuleSize: z.string().optional().nullable(),
  capsuleColor: z.string().optional().nullable(),
  capsuleType: z.string().optional().nullable()
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
    setValue
  } = useForm<EditRecipeData>({
    resolver: zodResolver(editRecipeSchema),
    mode: 'onSubmit', // 只在提交時驗證
    defaultValues: {
      recipeName: recipe.recipeName,
      productName: recipe.productName,
      description: recipe.description || '',
      capsuleSize: recipe.capsuleSize || null,
      capsuleColor: recipe.capsuleColor || '',
      capsuleType: recipe.capsuleType || null
    }
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

