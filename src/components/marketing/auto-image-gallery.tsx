'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, ImageIcon, CheckCircle, X } from 'lucide-react'
import { buildChineseImagePrompt, getImageTypeLabel } from '@/components/marketing/prompt-helpers'
import { useToast } from '@/components/ui/toast-provider'

interface AutoImageGalleryProps {
  analysisContent: string
  isAnalysisComplete: boolean
}

interface GeneratedImage {
  type: string
  label: string
  prompt: string
  imageUrl: string | null
  status: 'pending' | 'generating' | 'success' | 'error'
  error?: string
  generationTime?: number
}

export function AutoImageGallery({ analysisContent, isAnalysisComplete }: AutoImageGalleryProps) {
  const { showToast } = useToast()
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [productName, setProductName] = useState<string>('Premium Wellness Formula')
  const hasGeneratedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    hasGeneratedRef.current = false
    setImages([])
    setIsGenerating(false)
  }, [analysisContent])

  // 自動提取 prompts 並生成圖像
  useEffect(() => {
    if (!isAnalysisComplete || !analysisContent || isGenerating) return
    if (hasGeneratedRef.current) return

    // ========== STEP 1: Extract product name FIRST ==========
    const extractProductName = (content: string): string => {
      // Pattern 1: 建議產品英文名稱：Sleep Well Plus
      const pattern1 = /建議產品英文名稱[：:]\s*\*?\*?([A-Za-z\s]+(?:Plus|Pro|Elite|Advanced|Care|Boost|Support|Formula|Complex|Wellness)?)\*?\*?/i
      const match1 = content.match(pattern1)
      
      if (match1 && match1[1]) {
        const name = match1[1].trim()
        return name
      }
      
      // Pattern 2: Product Name: Energy Boost Pro (fallback)
      const pattern2 = /Product Name[：:]\s*\*?\*?([A-Za-z\s]+(?:Plus|Pro|Elite|Advanced|Care|Boost|Support|Formula|Complex|Wellness)?)\*?\*?/i
      const match2 = content.match(pattern2)
      
      if (match2 && match2[1]) {
        const name = match2[1].trim()
        return name
      }
      
      return 'Premium Wellness Formula'
    }
    
    const extractedProductName = extractProductName(analysisContent)
    setProductName(extractedProductName)  // Store in state for regenerateImage
    
    // ========== STEP 2: Extract image prompts ==========
    const extractedPrompts: GeneratedImage[] = []
    
    // 提取四種類型的 Prompt - 支援多種格式
    const promptPatterns = [
      { 
        regex: /(?:\*\*)?(?:實拍瓶身|瓶身實拍|產品瓶身).*?Prompt[：:]\*\*?[\s]*\n*(.+?)(?=\n\n|(?:\*\*)?(?:情境|平鋪|香港)|$)/is, 
        type: 'bottle', 
        label: '實拍瓶身' 
      },
      { 
        regex: /(?:\*\*)?(?:情境|使用場景|生活場景).*?Prompt[：:]\*\*?[\s]*\n*(.+?)(?=\n\n|(?:\*\*)?(?:平鋪|香港)|$)/is, 
        type: 'lifestyle', 
        label: '生活情境' 
      },
      { 
        regex: /(?:\*\*)?(?:平鋪|俯拍|平面).*?Prompt[：:]\*\*?[\s]*\n*(.+?)(?=\n\n|(?:\*\*)?(?:香港)|##|$)/is, 
        type: 'flatlay', 
        label: '平鋪俯拍' 
      },
      {
        regex: /(?:\*\*)?(?:香港製造|香港|Made in Hong Kong).*?Prompt[：:]\*\*?[\s]*\n*(.+?)(?=\n\n|##|$)/is,
        type: 'hongkong',
        label: '香港製造'
      }
    ]

    promptPatterns.forEach(({ regex, type, label }) => {
      const match = analysisContent.match(regex)
      if (match && match[1]) {
        const cleaned = match[1].trim()
          .replace(/^\[|\]$/g, '') // 移除方括號
          .replace(/^["']|["']$/g, '') // 移除引號
          .replace(/\n+/g, ' ') // 移除換行符
          .trim()
        
        if (cleaned.length > 10) {
          extractedPrompts.push({
            type,
            label,
            prompt: cleaned,
            imageUrl: null,
            status: 'pending'
          })
        }
      }
    })

    if (extractedPrompts.length > 0) {
      hasGeneratedRef.current = true
      setImages(extractedPrompts)
      
      // ========== STEP 3: Define generation function (captures productName in closure) ==========
      const generateAllImages = async (prompts: GeneratedImage[]) => {
        setIsGenerating(true)
        abortControllerRef.current = new AbortController()

        for (let i = 0; i < prompts.length; i++) {
          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            setIsGenerating(false)
            return
          }

          const prompt = prompts[i]
          const startTime = Date.now()
          
          // 更新狀態為生成中
          setImages(prev => prev.map((img, idx) => 
            idx === i ? { ...img, status: 'generating' } : img
          ))

          try {
            const response = await fetch('/api/ai/packaging-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                // ========== CRITICAL: Pass productName here! ==========
                prompt: buildChineseImagePrompt(prompt.prompt, prompt.type, extractedProductName),
                type: prompt.type,
                width: 1024,
                height: 1024
              }),
              signal: abortControllerRef.current.signal
            })

            const data = await response.json()
            const generationTime = Math.round((Date.now() - startTime) / 1000)

            if (data.success && data.data?.imageUrl) {
              setImages(prev => prev.map((img, idx) => 
                idx === i ? { 
                  ...img, 
                  imageUrl: data.data.imageUrl, 
                  status: 'success',
                  error: undefined,
                  generationTime
                } : img
              ))
            } else {
              throw new Error(data.error || '圖像生成失敗')
            }
          } catch (error) {
            if ((error as DOMException)?.name === 'AbortError') {
              setIsGenerating(false)
              return
            }
            const errorMsg = error instanceof Error ? error.message : '生成失敗'
            setImages(prev => prev.map((img, idx) => 
              idx === i ? { 
                ...img, 
                status: 'error', 
                error: errorMsg 
              } : img
            ))
          }

          // 等待一下再生成下一張（避免請求過快）
          if (i < prompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        setIsGenerating(false)
        abortControllerRef.current = null
        const successCount = images.filter(p => p.imageUrl).length
        showToast({
          title: '圖像生成完成',
          description: `已成功生成 ${successCount} 張 Easy Health 包裝設計圖`,
          variant: 'default'
        })
      }
      
      // 自動開始生成圖像
      generateAllImages(extractedPrompts)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisContent, isAnalysisComplete, isGenerating, showToast])

  const regenerateImage = async (index: number, image: GeneratedImage) => {
    setImages(prev => prev.map((img, idx) => idx === index ? { ...img, status: 'generating', error: undefined } : img))

    try {
      const response = await fetch('/api/ai/packaging-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ========== CRITICAL: Use productName from state ==========
          prompt: buildChineseImagePrompt(image.prompt, image.type, productName),
          type: image.type,
          width: 1024,
          height: 1024
        })
      })

      const data = await response.json()

      if (data.success && data.data?.imageUrl) {
        setImages(prev => prev.map((img, idx) =>
          idx === index
            ? { ...img, imageUrl: data.data.imageUrl, status: 'success', error: undefined }
            : img
        ))
        showToast({
          title: '已重新生成圖像',
          description: `${getImageTypeLabel(image.type)} 圖像已更新。`
        })
      } else {
        throw new Error(data.error || '圖像生成失敗')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '生成失敗'
      setImages(prev => prev.map((img, idx) =>
        idx === index ? { ...img, status: 'error', error: errorMsg } : img
      ))
      showToast({
        title: '重新生成失敗',
        description: errorMsg,
        variant: 'destructive'
      })
    }
  }

  const downloadImage = useCallback((imageUrl: string, label: string) => {
    try {
      const safeLabel = label.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').toLowerCase()
      const filename = `packaging-${safeLabel || 'image'}-${Date.now()}.png`

      let url = imageUrl
      let objectUrl: string | null = null

      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1]
        if (!base64Data) throw new Error('圖像資料格式錯誤')

        const mimeMatch = imageUrl.match(/^data:(.*?);/)
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'

        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType })
        objectUrl = URL.createObjectURL(blob)
        url = objectUrl
      }

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }))
      document.body.removeChild(link)

      if (objectUrl) {
        setTimeout(() => URL.revokeObjectURL(objectUrl!), 1500)
      }
    } catch (error) {
      showToast({
        title: '下載失敗',
        description: error instanceof Error ? error.message : '無法下載圖像，請稍後再試。',
        variant: 'destructive'
      })
    }
  }, [showToast])

  if (images.length === 0) {
    return null
  }

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
      showToast({
        title: '已取消生成',
        description: '圖片生成已停止',
        variant: 'default'
      })
    }
  }

  const downloadAllImages = () => {
    const successImages = images.filter(img => img.imageUrl && img.status === 'success')
    if (successImages.length === 0) {
      showToast({ 
        title: '沒有可下載的圖片', 
        description: '請等待圖片生成完成',
        variant: 'destructive' 
      })
      return
    }
    
    successImages.forEach((img, index) => {
      setTimeout(() => {
        downloadImage(img.imageUrl!, img.label)
      }, index * 500) // 每張圖片間隔 500ms 避免阻塞
    })
    
    showToast({
      title: '批量下載已開始',
      description: `正在下載 ${successImages.length} 張圖片...`
    })
  }

  const completedCount = images.filter(img => img.status === 'success').length
  const totalCount = images.length
  const generatingCount = images.filter(img => img.status === 'generating').length

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
      <div className="liquid-glass-content">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="icon-container icon-container-emerald">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">AI 包裝設計圖像</h2>
              <p className="text-sm text-neutral-500">
                自動生成 4 種風格的產品包裝視覺 ({completedCount}/{totalCount} 已完成)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGenerating && (
              <Button
                type="button"
                variant="outline"
                onClick={cancelGeneration}
                className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-danger-50"
              >
                <X className="h-4 w-4" />
                取消生成
              </Button>
            )}
            {completedCount > 0 && (
              <Button
                type="button"
                onClick={downloadAllImages}
                disabled={isGenerating}
                className="bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                下載全部圖片
              </Button>
            )}
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        {isGenerating && (
          <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary-700">
                正在生成圖片... ({completedCount}/{totalCount})
              </span>
              <span className="text-xs text-primary-600">
                {generatingCount > 0 && '生成中'}
              </span>
            </div>
            <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {getImageTypeLabel(image.type)}
                </Badge>
                {image.status === 'generating' && (
                  <span className="text-xs text-primary-600 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    生成中...
                  </span>
                )}
                {image.status === 'success' && (
                  <span className="text-xs text-success-600 flex items-center gap-1">
                    ✓ 完成
                    {image.generationTime && (
                      <span className="text-neutral-400">({image.generationTime}s)</span>
                    )}
                  </span>
                )}
                {image.status === 'error' && (
                  <span className="text-xs text-red-600">✗ 失敗</span>
                )}
              </div>

              <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-gray-50 w-full aspect-square">
                {image.status === 'pending' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm text-neutral-400">等待生成...</span>
                  </div>
                )}
                {image.status === 'generating' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-8 w-8 animate-spin text-success-600" />
                  </div>
                )}
                {image.status === 'success' && image.imageUrl && (
                  <Image
                    src={image.imageUrl}
                    alt={getImageTypeLabel(image.type)}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                )}
              {image.status === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-red-600 mb-1">生成失敗</p>
                      <p className="text-xs text-neutral-500">{image.error}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => regenerateImage(index, image)}
                      className="w-full"
                    >
                      重新生成
                    </Button>
                  </div>
                </div>
              )}
              </div>

              {image.imageUrl && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-2"
                    onClick={() => downloadImage(image.imageUrl!, image.label)}
                  >
                    <Download className="h-4 w-4" />
                    下載圖像
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => regenerateImage(index, image)}
                  >
                    重新生成
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

