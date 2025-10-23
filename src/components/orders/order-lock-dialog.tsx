'use client'

import { useState, useEffect } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

interface OrderLockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'set' | 'change' | 'verify'
  orderId: string
  onSuccess: (password?: string) => void
}

export function OrderLockDialog({
  open,
  onOpenChange,
  mode,
  orderId,
  onSuccess
}: OrderLockDialogProps) {
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (mode === 'verify') {
        // 驗證密碼
        const response = await fetch(`/api/orders/${orderId}/verify-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        })

        const data = await response.json()

        if (data.success && data.valid) {
          showToast({
            title: '驗證成功',
            description: '密碼正確，可以編輯訂單',
            variant: 'default'
          })
          onSuccess(password)
          onOpenChange(false)
        } else {
          showToast({
            title: '驗證失敗',
            description: '密碼錯誤，請重新輸入',
            variant: 'destructive'
          })
        }
      } else if (mode === 'set' || mode === 'change') {
        // 設定或修改密碼
        if (password !== confirmPassword) {
          showToast({
            title: '密碼不一致',
            description: '兩次輸入的密碼必須相同',
            variant: 'destructive'
          })
          return
        }

        const response = await fetch(`/api/orders/${orderId}/lock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        })

        const data = await response.json()

        if (data.success) {
          showToast({
            title: '設定成功',
            description: mode === 'set' ? '密碼鎖已設定' : '密碼已修改',
            variant: 'default'
          })
          onSuccess(password)
          onOpenChange(false)
        } else {
          showToast({
            title: '設定失敗',
            description: data.error || '密碼設定失敗',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      showToast({
        title: '操作失敗',
        description: '網路錯誤，請稍後再試',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDialogTitle = () => {
    switch (mode) {
      case 'set': return '設定密碼保護'
      case 'change': return '修改密碼'
      case 'verify': return '驗證密碼'
      default: return '密碼操作'
    }
  }

  const getDialogDescription = () => {
    switch (mode) {
      case 'set': return '為此訂單設定 4 位數字密碼，保護客戶指定的原料配方不被隨意修改。只有修改客戶指定原料時才需要密碼驗證。'
      case 'change': return '修改訂單的密碼保護，輸入新的 4 位數字密碼。'
      case 'verify': return '此訂單已設定密碼保護，請輸入密碼以繼續編輯客戶指定的原料配方。'
      default: return ''
    }
  }

  const getSubmitButtonText = () => {
    switch (mode) {
      case 'set': return '設定密碼'
      case 'change': return '修改密碼'
      case 'verify': return '驗證並繼續'
      default: return '確認'
    }
  }

  const footer = (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="flex-1 bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300"
        disabled={isLoading}
      >
        取消
      </Button>
      <Button
        type="submit"
        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30"
        disabled={isLoading || password.length !== 4}
        onClick={handleSubmit}
      >
        {isLoading ? '處理中...' : getSubmitButtonText()}
      </Button>
    </div>
  )

  return (
    <LiquidGlassModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={getDialogTitle()}
      footer={footer}
      size="md"
      closeOnBackdropClick={true}
      closeOnEscape={true}
      className="white-theme"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-blue-50/80 border border-blue-200/50">
          {mode === 'verify' ? (
            <Lock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          ) : (
            <Unlock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-sm text-neutral-700 leading-relaxed">{getDialogDescription()}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-neutral-900 font-medium">密碼</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入 4 位數字"
                maxLength={4}
                pattern="[0-9]{4}"
                className="pr-10 text-center text-lg tracking-widest bg-white border-neutral-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-600">密碼必須是 4 位數字</p>
          </div>

          {(mode === 'set' || mode === 'change') && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-neutral-900 font-medium">確認密碼</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="請再次輸入密碼"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  className="pr-10 text-center text-lg tracking-widest bg-white border-neutral-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </LiquidGlassModal>
  )
}
