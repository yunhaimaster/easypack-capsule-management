'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, ImageIcon, CheckCircle, X } from 'lucide-react'
import { buildChineseImagePrompt, getImageTypeLabel } from '@/components/marketing/prompt-helpers'
import { useToast } from '@/components/ui/toast-provider'
import { cn } from '@/lib/utils'

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
  seed?: number // 保存使用的 seed
  isEditing?: boolean // 是否處於編輯狀態
  width?: number // 圖片寬度
  height?: number // 圖片高度
}

export function AutoImageGallery({ analysisContent, isAnalysisComplete }: AutoImageGalleryProps) {
  const { showToast } = useToast()
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [productName, setProductName] = useState<string>('Premium Wellness Formula')
  const [chineseProductName, setChineseProductName] = useState<string | undefined>(undefined)
  const [editingPrompts, setEditingPrompts] = useState<Record<number, string>>({})
  const hasGeneratedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 解析視覺風格指令中的主色/輔色，供香港製造圖片沿用標籤配色
  const parseLabelPalette = (content: string): { main: string; accent?: string } | null => {
    try {
      // 尋找包含「主色」「輔色」的方括號段落
      const bracketBlocks = content.match(/\[[^\]]*主色[^\]]*\]/g)
      const source = bracketBlocks?.[0] || content
      const mainMatch = source.match(/主色[：:]\s*([^,\]\n]+)/)
      const accentMatch = source.match(/輔色[：:]\s*([^,\]\n]+)/)

      const clean = (s: string) => s
        .replace(/佔\d+%/g, '')
        .replace(/為主|為輔/g, '')
        .replace(/\d+%/g, '')
        .replace(/\([^\)]*\)/g, '')
        .replace(/\+/g, '、')
        .replace(/\s{2,}/g, ' ')
        .trim()

      const main = mainMatch ? clean(mainMatch[1]) : ''
      const accent = accentMatch ? clean(accentMatch[1]) : undefined
      if (!main) return null
      return { main, accent }
    } catch {
      return null
    }
  }

  const computeLabelPalette = (list: Array<{ type: string; prompt: string }>): { main: string; accent?: string } | undefined => {
    // 優先使用 bottle → lifestyle → flatlay 的配色作為「產品標籤」基準
    const order = ['bottle', 'lifestyle', 'flatlay']
    for (const t of order) {
      const candidate = list.find(x => x.type === t)
      if (candidate) {
        const palette = parseLabelPalette(candidate.prompt)
        if (palette) return palette
      }
    }
    return undefined
  }

  // 頁面載入時恢復圖片
  useEffect(() => {
    const saved = localStorage.getItem('marketing_images_cache')
    if (saved) {
      try {
        const { images: savedImages, timestamp } = JSON.parse(saved)
        // 只恢復 24 小時內的圖片
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setImages(savedImages)
        } else {
          localStorage.removeItem('marketing_images_cache')
        }
      } catch (error) {
        console.error('恢復圖片失敗:', error)
        localStorage.removeItem('marketing_images_cache')
      }
    }
  }, [])

  // 圖片生成完成時保存到 localStorage
  useEffect(() => {
    if (images.length > 0 && images.some(img => img.status === 'success')) {
      localStorage.setItem('marketing_images_cache', JSON.stringify({
        images,
        timestamp: Date.now()
      }))
    }
  }, [images])

  useEffect(() => {
    hasGeneratedRef.current = false
    setImages([])
    setIsGenerating(false)
    localStorage.removeItem('marketing_images_cache') // 清除舊圖片
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
    
    // Extract Chinese product name
    const extractChineseProductName = (content: string): string | undefined => {
      // Pattern: 建議產品中文名稱：美白煥膚膠囊
      const pattern = /建議產品中文名稱[：:]\s*\*?\*?([^\n*]+?)\*?\*?(?:\n|$)/
      const match = content.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
      return undefined
    }
    
    const extractedChineseName = extractChineseProductName(analysisContent)
    setChineseProductName(extractedChineseName)  // Store Chinese name in state
    
    // ========== STEP 2: Extract image prompts ==========
    const extractedPrompts: GeneratedImage[] = []
    
    // 提取五種類型的 Prompt - 使用明確的分隔符
    const promptPatterns = [
      { 
        regex: /===PROMPT_START:BOTTLE===\s*\n*(.+?)\s*\n*===PROMPT_END===/is,
        type: 'bottle', 
        label: '實拍瓶身',
        width: 2048,
        height: 2048
      },
      { 
        regex: /===PROMPT_START:LIFESTYLE===\s*\n*(.+?)\s*\n*===PROMPT_END===/is,
        type: 'lifestyle', 
        label: '生活情境',
        width: 2048,
        height: 2048
      },
      { 
        regex: /===PROMPT_START:FLATLAY===\s*\n*(.+?)\s*\n*===PROMPT_END===/is,
        type: 'flatlay', 
        label: '平鋪俯拍',
        width: 2048,
        height: 2048
      },
      {
        regex: /===PROMPT_START:HONGKONG===\s*\n*(.+?)\s*\n*===PROMPT_END===/is,
        type: 'hongkong',
        label: '香港製造',
        width: 2048,
        height: 2048
      },
      {
        regex: /===PROMPT_START:POSTER===\s*\n*(.+?)\s*\n*===PROMPT_END===/is,
        type: 'poster',
        label: '宣傳海報',
        width: 3520,
        height: 4704
      }
    ]

    promptPatterns.forEach(({ regex, type, label, width, height }) => {
      const match = analysisContent.match(regex)
      if (match && match[1]) {
        // ✅ 最小化處理：只移除首尾引號，保留所有 DeepSeek 的內容
        const cleaned = match[1].trim()
          .replace(/^["']|["']$/g, '') // 只移除引號
          // 保留方括號結構！DeepSeek 的視覺指令格式需要
          // 保留換行符！多段內容需要結構
        
        if (cleaned.length > 10) {
          extractedPrompts.push({
            type,
            label,
            prompt: cleaned,
            imageUrl: null,
            status: 'pending',
            width,
            height
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
        
        // 🆕 Generate a consistent seed for all images in this batch
        const sessionSeed = Math.floor(Math.random() * 1000000)
        console.log('🎨 Using consistent seed for all images:', sessionSeed)

        // 🆕 解析非香港圖片的配色，作為香港製造標籤配色基準
        const labelPalette = computeLabelPalette(prompts.filter(p => p.type !== 'hongkong'))

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
                // Pass both English and Chinese product names
                prompt: buildChineseImagePrompt(
                  prompt.prompt, 
                  prompt.type, 
                  extractedProductName,
                  extractedChineseName,
                  prompt.type === 'hongkong' ? labelPalette : undefined
                ),
                type: prompt.type,
                width: prompt.width || 2048,  // Use specified width or default 2048
                height: prompt.height || 2048, // Use specified height or default 2048
                seed: sessionSeed // 🆕 Use consistent seed for all images
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
                  generationTime,
                  seed: data.data.seed // 保存使用的 seed
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

  const regenerateImage = async (index: number, image: GeneratedImage, customPrompt?: string) => {
    setImages(prev => prev.map((img, idx) => 
      idx === index ? { ...img, status: 'generating', error: undefined, isEditing: false } : img
    ))

    try {
      const finalPrompt = customPrompt || image.prompt
      
      // 🆕 重新生成時同樣維持香港製造標籤配色與其他圖一致
      const labelPalette = computeLabelPalette(images.filter(x => x.type !== 'hongkong'))

      const response = await fetch('/api/ai/packaging-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildChineseImagePrompt(
            finalPrompt, 
            image.type, 
            productName,
            chineseProductName,
            image.type === 'hongkong' ? labelPalette : undefined
          ),
          type: image.type,
          width: image.width || 2048,
          height: image.height || 2048,
          seed: Math.floor(Math.random() * 1000000)
        })
      })

      const data = await response.json()

      if (data.success && data.data?.imageUrl) {
        setImages(prev => prev.map((img, idx) =>
          idx === index
            ? { 
                ...img, 
                imageUrl: data.data.imageUrl, 
                status: 'success', 
                error: undefined,
                prompt: finalPrompt, // 更新為新的 prompt
                seed: data.data.seed
              }
            : img
        ))
        // 清除編輯狀態
        setEditingPrompts(prev => {
          const next = { ...prev }
          delete next[index]
          return next
        })
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

  const toggleEditMode = (index: number, image: GeneratedImage) => {
    setImages(prev => prev.map((img, idx) => 
      idx === index ? { ...img, isEditing: !img.isEditing } : img
    ))
    
    if (!images[index].isEditing) {
      setEditingPrompts(prev => ({ ...prev, [index]: image.prompt }))
    }
  }

  const handlePromptChange = (index: number, value: string) => {
    setEditingPrompts(prev => ({ ...prev, [index]: value }))
  }

  const handlePromptSubmit = (index: number, image: GeneratedImage) => {
    const customPrompt = editingPrompts[index]
    if (customPrompt && customPrompt.trim()) {
      regenerateImage(index, image, customPrompt.trim())
    }
  }

  const cancelEdit = (index: number) => {
    setImages(prev => prev.map((img, idx) => 
      idx === index ? { ...img, isEditing: false } : img
    ))
    setEditingPrompts(prev => {
      const next = { ...prev }
      delete next[index]
      return next
    })
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
                自動生成 5 種風格的產品包裝視覺 ({completedCount}/{totalCount} 已完成)
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

              <div className={cn(
                "relative rounded-lg overflow-hidden border border-neutral-200 bg-gray-50 w-full",
                image.type === 'poster' ? 'aspect-[3/4]' : 'aspect-square'
              )}>
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
                    quality={85}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

              {/* Prompt 編輯區域 */}
              {image.status === 'success' && (
                <div className="mt-3 space-y-2">
                  {image.seed && (
                    <div className="text-xs text-neutral-400 flex items-center gap-1">
                      <span>Seed: {image.seed}</span>
                    </div>
                  )}
                  {!image.isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-600">Prompt</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEditMode(index, image)}
                          className="h-6 px-2 text-xs"
                        >
                          編輯
                        </Button>
                      </div>
                      <div className="text-xs text-neutral-500 bg-neutral-50 rounded-md p-2 max-h-20 overflow-y-auto">
                        {image.prompt}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-600">編輯 Prompt</span>
                      </div>
                      <textarea
                        value={editingPrompts[index] || image.prompt}
                        onChange={(e) => handlePromptChange(index, e.target.value)}
                        className="w-full text-xs border border-neutral-300 rounded-md p-2 min-h-[100px] resize-y focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="修改圖像生成 prompt..."
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handlePromptSubmit(index, image)}
                          disabled={!editingPrompts[index] || editingPrompts[index].trim() === ''}
                          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-xs h-8"
                        >
                          使用新 Prompt 生成
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => cancelEdit(index)}
                          className="flex-1 text-xs h-8"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

