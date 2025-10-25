'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Loader2, Image as ImageIcon, AlertCircle, CheckCircle2, ChevronRight, Sparkles, AlertTriangle } from 'lucide-react'
import { getGlassBadgeTone } from '@/lib/ui/glass-tones'
import { logger } from '@/lib/logger'
import { formatNumber } from '@/lib/utils'
import { AIPoweredBadge } from '@/components/ui/ai-powered-badge'
import { useToast } from '@/components/ui/toast-provider'

interface ParsedIngredient {
  materialName: string
  unitContentMg: number
  originalText?: string
  needsConfirmation?: boolean
  isCustomerProvided?: boolean
  isCustomerSupplied?: boolean
}

interface SmartRecipeImportProps {
  onImport: (ingredients: ParsedIngredient[]) => void
  disabled?: boolean
}

export function SmartRecipeImport({ onImport, disabled }: SmartRecipeImportProps) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importImage, setImportImage] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedIngredients, setParsedIngredients] = useState<ParsedIngredient[]>([])
  const [parseError, setParseError] = useState('')
  const [parseSummary, setParseSummary] = useState('')
  const [confidence, setConfidence] = useState<'高' | '中' | '低'>('中')
  const [importMode, setImportMode] = useState<'text' | 'image'>('image')
  const [isRecipeDragging, setIsRecipeDragging] = useState(false)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    processImageFile(file)

    // 重置 input 以允許多次選擇相同檔案
    event.target.value = ''
  }

  const processImageFile = (file: File) => {
    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      showToast({
        title: '無效的檔案',
        description: '請選擇圖片檔案 (JPG / PNG)。',
        variant: 'destructive'
      })
      setIsRecipeDragging(false)
      return
    }

    // 檢查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast({
        title: '檔案過大',
        description: '圖片文件大小不能超過 10MB。',
        variant: 'destructive'
      })
      setIsRecipeDragging(false)
      return
    }

    // 開始載入
    setIsLoadingImage(true)
    setIsRecipeDragging(false)

    // 使用 setTimeout 讓 UI 有時間更新載入狀態
    setTimeout(() => {
      const reader = new FileReader()
      
      reader.onloadstart = () => {
        // 大文件開始讀取時顯示提示
        if (file.size > 1 * 1024 * 1024) { // > 1MB
          showToast({
            title: '正在載入圖片',
            description: '大圖片載入中，請稍候...'
          })
        }
      }

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          // 圖片載入進度追蹤（如需顯示進度條可以使用此值）
          logger.info('Image loading progress', { percentComplete: percentComplete.toFixed(0) })
        }
      }
      
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImportImage(result)
        setImportMode('image')
        setIsLoadingImage(false)
        showToast({
          title: '圖片已載入',
          description: '圖片已成功上傳，可以開始解析。'
        })
      }
      
      reader.onerror = () => {
        setIsLoadingImage(false)
        showToast({
          title: '讀取失敗',
          description: '無法讀取圖片檔案，請重試。',
          variant: 'destructive'
        })
      }
      
      reader.onabort = () => {
        setIsLoadingImage(false)
        showToast({
          title: '讀取已取消',
          description: '圖片載入已中斷。',
          variant: 'destructive'
        })
      }
      
      try {
        reader.readAsDataURL(file)
      } catch (error) {
        setIsLoadingImage(false)
        console.error('FileReader error:', error)
        showToast({
          title: '載入錯誤',
          description: '無法開始讀取圖片檔案。',
          variant: 'destructive'
        })
      }
    }, 100) // 100ms 延遲讓 UI 有時間更新
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsRecipeDragging(true)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsRecipeDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    // 只有当真正离开容器时才设置为 false
    const rect = event.currentTarget.getBoundingClientRect()
    if (
      event.clientX < rect.left ||
      event.clientX >= rect.right ||
      event.clientY < rect.top ||
      event.clientY >= rect.bottom
    ) {
      setIsRecipeDragging(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsRecipeDragging(false)
    
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      processImageFile(files[0])
    }
  }

  const handleParse = async () => {
    if (importMode === 'text' && !importText.trim()) {
      setParseError('請輸入要解析的配方文字')
      return
    }
    
    if (importMode === 'image' && !importImage) {
      setParseError('請上傳要解析的配方圖片')
      return
    }

    setIsParsing(true)
    setParseError('')
    setParsedIngredients([])

    try {
      logger.info('開始解析配方', {
        mode: importMode,
        hasText: importMode === 'text' ? Boolean(importText.trim()) : undefined,
        hasImage: importMode === 'image' ? Boolean(importImage) : undefined
      })
      
      const response = await fetch('/api/ai/parse-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: importMode === 'text' ? importText.trim() : undefined,
          image: importMode === 'image' ? importImage : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        logger.error('配方解析 API 錯誤回應', { errorData })
        throw new Error(errorData.error || `解析失敗 (${response.status})`)
      }

      const data = await response.json()
      logger.debug('配方解析 API 成功回應', { hasIngredients: Boolean(data?.data?.ingredients?.length) })
      
      if (data.success && data.data) {
        const ingredients = (data.data.ingredients || []).map((ingredient: ParsedIngredient) => ({
          ...ingredient,
          isCustomerProvided: ingredient.isCustomerProvided ?? true,
          isCustomerSupplied: ingredient.isCustomerSupplied ?? false
        }))
        logger.debug('解析到的原料', { count: ingredients.length })
        
        if (ingredients.length === 0) {
          throw new Error('未能解析到任何原料，請檢查配方格式')
        }
        
        setParsedIngredients(ingredients)
        setParseSummary(data.data.summary || '')
        setConfidence(data.data.confidence || '中')
        showToast({
          title: '解析完成',
          description: `成功解析 ${ingredients.length} 項原料。`
        })
      } else {
        throw new Error(data.error || '解析失敗')
      }
    } catch (error) {
      logger.error('智能配方解析錯誤', {
        error: error instanceof Error ? error.message : String(error)
      })
      setParseError(error instanceof Error ? error.message : '解析失敗，請稍後再試')
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirmImport = () => {
    if (parsedIngredients.length > 0) {
      try {
        logger.info('確認導入原料', { count: parsedIngredients.length })
        showToast({
          title: '原料已導入',
          description: '智能解析的原料已套用到表單。'
        })
        onImport(parsedIngredients)
        
        // 延遲關閉對話框，確保導入完成
        setTimeout(() => {
          setIsOpen(false)
          setImportText('')
          setImportImage(null)
          setImportMode('text')
          setIsRecipeDragging(false)
          setParsedIngredients([])
          setParseError('')
          setParseSummary('')
        }, 100)
      } catch (error) {
        logger.error('導入確認時發生錯誤', {
          error: error instanceof Error ? error.message : String(error)
        })
        setParseError('導入失敗，請重試')
        showToast({
          title: '導入失敗',
          description: error instanceof Error ? error.message : '導入原料時發生錯誤。',
          variant: 'destructive'
        })
      }
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setImportText('')
    setImportImage(null)
    setImportMode('text')
    setIsRecipeDragging(false)
    setParsedIngredients([])
    setParseError('')
    setParseSummary('')
    showToast({
      title: '已取消',
      description: '已清除暫存的導入資料。'
    })
  }

  const handleUploadClick = useCallback(() => {
    if (!fileInputRef.current) {
      showToast({
        title: '找不到上傳元件',
        description: '請重新整理頁面後再試一次。',
        variant: 'destructive'
      })
      return
    }

    try {
      fileInputRef.current.click()
    } catch (error) {
      console.error('觸發圖片選擇器時發生錯誤:', error)
      showToast({
        title: '無法開啟檔案選擇器',
        description: '請檢查瀏覽器設定或重新整理頁面後再試。',
        variant: 'destructive'
      })
    }
  }, [showToast])

  const resolveConfidenceBadge = (confidence: '低' | '中' | '高' | '未知') => {
    if (confidence === '高') return getGlassBadgeTone('positive')
    if (confidence === '中') return getGlassBadgeTone('caution')
    if (confidence === '低') return getGlassBadgeTone('negative')
    return getGlassBadgeTone('neutral')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="w-full sm:w-auto"
        >
          <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
          智能導入配方
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" aria-hidden="true" />
            智能配方導入
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 模式選擇 */}
          <Card className="liquid-glass-card liquid-glass-card-elevated">
            <CardHeader>
              <CardTitle className="text-lg">選擇導入方式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={importMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setImportMode('text')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                  文字輸入
                </Button>
                <Button
                  variant={importMode === 'image' ? 'default' : 'outline'}
                  onClick={() => setImportMode('image')}
                  className="flex-1"
                >
                  <ImageIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                  圖片上傳
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 文字輸入區域 */}
          {importMode === 'text' && (
            <Card className="liquid-glass-card liquid-glass-card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">輸入配方文字</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="import-text">配方內容</Label>
                  <Textarea
                    id="import-text"
                    placeholder="請貼上配方文字，例如：&#10;維生素C: 500mg&#10;維生素D3: 1000IU&#10;鈣: 200mg&#10;鎂: 100mg&#10;鋅: 15mg"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="min-h-[120px]"
                    disabled={isParsing}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleParse} 
                    disabled={isParsing || !importText.trim()}
                    className="ripple-effect btn-micro-hover micro-brand-glow flex-1"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 micro-loading" aria-hidden="true" />
                        解析中...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2 icon-micro-bounce" aria-hidden="true" />
                        解析配方
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 圖片上傳區域 */}
          {importMode === 'image' && (
            <Card className="liquid-glass-card liquid-glass-card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">上傳配方圖片</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingImage ? (
                  <div className="border-2 border-dashed rounded-2xl p-12 text-center border-primary-300 bg-primary-50/50">
                    <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary-500 animate-spin" aria-hidden="true" />
                    <p className="text-sm text-primary-700 font-medium mb-2">載入圖片中...</p>
                    <p className="text-xs text-primary-600">請稍候，大圖片可能需要幾秒鐘</p>
                  </div>
                ) : !importImage ? (
                  <>
                    <div
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isRecipeDragging
                          ? 'border-success-500 bg-success-50/50 scale-[1.02]'
                          : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50/50'
                      }`}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                        isRecipeDragging ? 'bg-success-500/10' : 'bg-neutral-900/5'
                      }`}>
                        <Upload className={`w-8 h-8 transition-colors ${
                          isRecipeDragging ? 'text-success-600' : 'text-neutral-500 dark:text-white/65'
                        }`} aria-hidden="true" />
                      </div>
                      <p className={`font-medium transition-colors ${
                        isRecipeDragging ? 'text-success-700' : 'text-neutral-700 dark:text-white/85'
                      }`}>
                        {isRecipeDragging ? '放開以上傳圖片' : '拖放圖片至此'}
                      </p>
                      <p className="text-neutral-500 dark:text-white/65 text-sm mt-2">支援 JPG、PNG 等常見格式，建議高解析度以提高辨識準確度</p>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        variant="outline"
                        disabled={isLoadingImage} 
                        type="button"
                        onClick={handleUploadClick}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                        選擇圖片文件
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-success-50/80 rounded-xl p-4 border border-success-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-success-700">圖片已上傳</div>
                          <div className="text-xs text-success-600 mt-1">圖片大小：{Math.round(importImage.length / 1024)} KB</div>
                        </div>
                        <Button
                          onClick={() => {
                            setImportImage(null)
                            showToast({
                              title: '已移除圖片',
                              description: '可以重新上傳新的圖片。'
                            })
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-success-600 hover:text-success-700 hover:bg-success-100"
                        >
                          更換
                        </Button>
                      </div>
                    </div>
                    {/* 圖片預覽 */}
                    <div className="rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 relative w-full" style={{ minHeight: '200px' }}>
                      <Image
                        src={importImage}
                        alt="上傳的配方圖片"
                        width={800}
                        height={600}
                        quality={85}
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="sr-only"
                  onChange={handleImageUpload}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleParse} 
                    disabled={isParsing || !importImage}
                    className="ripple-effect btn-micro-hover micro-brand-glow w-full"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 micro-loading" aria-hidden="true" />
                        解析中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 icon-micro-bounce" aria-hidden="true" />
                        開始解析
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 解析結果 */}
          <Card tone="positive" className="liquid-glass-card liquid-glass-card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">導入結果</CardTitle>
                  <AIPoweredBadge variant="minimal" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={resolveConfidenceBadge(confidence)}>
                    信心度: {confidence}
                  </Badge>
                  <Badge variant="outline">
                    {parsedIngredients.length} 種原料
                  </Badge>
                </div>
              </div>
              {parseSummary && (
                <p className="text-sm text-muted-foreground">{parseSummary}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {parsedIngredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className={`rounded-xl px-4 py-3 transition-colors ${getGlassBadgeTone(
                      ingredient.needsConfirmation ? 'caution' : 'positive'
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ingredient.materialName}</span>
                          {ingredient.needsConfirmation && (
                            <Badge variant="outline" className="text-xs">
                              需確認
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          含量: {formatNumber(ingredient.unitContentMg)} mg
                        </div>
                        {ingredient.originalText && (
                          <div className="text-xs text-muted-foreground mt-1">
                            原始: {ingredient.originalText}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {ingredient.needsConfirmation ? (
                          <AlertCircle className="w-4 h-4 text-warning-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-success-600" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 操作按鈕 */}
          {parsedIngredients.length > 0 && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={handleConfirmImport}>
                確認導入
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
