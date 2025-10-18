'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, CheckCircle, TrendingUp, Package } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import type { RecipeLibraryItem } from '@/types'

interface SaveRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderData: {
    customerName: string
    productName: string
    ingredientCount: number
    processIssues?: string
    qualityNotes?: string
    existingNotes?: string
  }
  existingRecipe?: RecipeLibraryItem | null
  alreadyRecorded?: boolean
  onSuccess?: (recipe: RecipeLibraryItem) => void
}

export function SaveRecipeDialog({
  open,
  onOpenChange,
  orderId,
  orderData,
  existingRecipe,
  alreadyRecorded,
  onSuccess
}: SaveRecipeDialogProps) {
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [recipeName, setRecipeName] = useState(orderData.productName)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState(orderData.existingNotes || '')

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/recipes/from-order/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: recipeName.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
          notes: notes.trim() || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess?.(result.data)
        onOpenChange(false)
        
        // Reset form
        setRecipeName(orderData.productName)
        setDescription('')
        setCategory('')
        setTags('')
        setNotes('')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Save recipe error:', error)
      showToast({
        title: '保存失敗',
        description: error instanceof Error ? error.message : '保存配方失敗',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingRecipe ? '更新配方生產記錄' : '保存為配方'}
          </DialogTitle>
          <DialogDescription>
            {existingRecipe
              ? '此配方已存在於配方庫中，將更新生產記錄。'
              : '將此訂單的配方保存到配方庫，方便日後快速創建訂單。'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {existingRecipe && (
            <Alert variant={alreadyRecorded ? 'default' : 'default'}>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{existingRecipe.recipeName}</p>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      已生產 {existingRecipe.productionCount} 次
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      已使用 {existingRecipe.usageCount} 次
                    </span>
                  </div>
                  {alreadyRecorded && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ 此訂單已在配方庫中記錄
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!existingRecipe && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <div className="space-y-1">
                  <p>• 客戶：{orderData.customerName}</p>
                  <p>• 產品：{orderData.productName}</p>
                  <p>• 原料：{orderData.ingredientCount} 項</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              配方名稱 *
            </label>
            <Input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="輸入配方名稱"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述（可選）
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="輸入配方描述"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分類（可選）
              </label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例如：保健、運動"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                標籤（可選）
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="用逗號分隔"
              />
              <p className="text-xs text-gray-500 mt-1">
                例如：素食,有機
              </p>
            </div>
          </div>

          {!existingRecipe && (orderData.processIssues || orderData.qualityNotes) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 space-y-2">
              <div className="space-y-2">
                {orderData.processIssues && (
                  <p className="whitespace-pre-line">
                    <span className="font-medium">【製程問題】</span>
                    <br />
                    {orderData.processIssues}
                  </p>
                )}
                {orderData.qualityNotes && (
                  <p className="whitespace-pre-line">
                    <span className="font-medium">【品管備註】</span>
                    <br />
                    {orderData.qualityNotes}
                  </p>
                )}
              </div>
              <p className="text-xs text-blue-800">
                以上內容保存時會自動合併到配方備註，可在下方自行補充或修改。
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備註（可選）
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="輸入備註（若為空，將自動使用訂單備註）"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !recipeName.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : existingRecipe ? (
                alreadyRecorded ? '確認' : '更新生產記錄'
              ) : (
                '保存配方'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

