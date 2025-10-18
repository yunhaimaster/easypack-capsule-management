'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Languages } from 'lucide-react'
import { AIPoweredBadge } from '@/components/ui/ai-powered-badge'
import { useToast } from '@/components/ui/toast-provider'

interface FieldTranslatorProps {
  value: string
  onTranslate: (translatedText: string) => void
  className?: string
  disabled?: boolean
}

export function FieldTranslator({ value, onTranslate, className, disabled }: FieldTranslatorProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const { showToast } = useToast()

  const handleTranslate = async () => {
    if (!value.trim()) {
      showToast({
        title: '無可翻譯內容',
        description: '請先輸入要翻譯的文字。',
        variant: 'destructive'
      })
      return
    }

    setIsTranslating(true)
    
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: value.trim()
        }),
      })

      if (!response.ok) {
        throw new Error('翻譯服務暫時無法使用')
      }

      const data = await response.json()
      
      if (data.success) {
        onTranslate(data.translatedText)
        showToast({
          title: '翻譯完成',
          description: '內容已轉換為繁體中文。'
        })
      } else {
        throw new Error(data.error || '翻譯失敗')
      }
    } catch (error) {
      console.error('翻譯錯誤:', error)
      showToast({
        title: '翻譯失敗',
        description: error instanceof Error ? error.message : '翻譯服務暫時無法使用',
        variant: 'destructive'
      })
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTranslate}
        disabled={isTranslating || disabled || !value.trim()}
        className={className}
        title="使用 AI 將簡體中文轉換為繁體中文"
      >
        {isTranslating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Languages className="h-4 w-4" />
        )}
        <span className="ml-2">
          {isTranslating ? '翻譯中...' : '繁轉'}
        </span>
      </Button>
      <AIPoweredBadge variant="minimal" />
    </div>
  )
}
