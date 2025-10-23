'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Image as ImageIcon, Loader2, Download, AlertCircle, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

interface ImageGeneratorProps {
  analysisContent: string
}

interface GeneratedImage {
  prompt: string
  imageUrl: string
  timestamp: number
}

export function ImageGenerator({ analysisContent }: ImageGeneratorProps) {
  const { showToast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateImage = async () => {
    if (!selectedPrompt.trim()) {
      showToast({
        title: '缺少 Prompt',
        description: '請先輸入圖像生成提示詞',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    try {
      const response = await fetch('/api/ai/packaging-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selectedPrompt,
          width: 1024,
          height: 1024
        })
      })

      const data = await response.json()

      if (!data.success || !data.data?.imageUrl) {
        throw new Error(data.error || '圖像生成失敗')
      }

      setGeneratedImage({
        prompt: selectedPrompt,
        imageUrl: data.data.imageUrl,
        timestamp: Date.now()
      })

      showToast({
        title: '生成成功',
        description: '包裝圖像已生成完畢',
        variant: 'default'
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '生成失敗，請稍後再試'
      setError(errorMsg)
      showToast({
        title: '生成失敗',
        description: errorMsg,
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.href = generatedImage.imageUrl
    link.download = `packaging-${generatedImage.timestamp}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
      <div className="liquid-glass-content">
        <div className="flex items-center gap-3 mb-6">
          <div className="icon-container icon-container-emerald">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">AI 包裝圖像生成</h2>
            <p className="text-sm text-neutral-500">使用 Gemini 2.5 Flash Image 模型生成產品包裝視覺</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              圖像生成 Prompt
            </label>
            <textarea
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
              placeholder="輸入或貼上從上方提取的 Prompt，或自行撰寫圖像描述..."
            />
          </div>

          <Button
            onClick={generateImage}
            disabled={isGenerating || !selectedPrompt.trim()}
            className="w-full bg-success-600 hover:bg-success-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成包裝圖像
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {generatedImage && (
            <div className="space-y-3">
              <Badge variant="outline" className="text-xs">
                生成完成
              </Badge>
              <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 w-full aspect-square">
                <Image
                  src={generatedImage.imageUrl}
                  alt="生成的包裝圖像"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <Button
                onClick={downloadImage}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                下載圖像
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

