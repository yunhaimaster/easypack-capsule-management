'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Upload, FileText, Loader2, Image as ImageIcon, CheckCircle2, Trash2, Sparkles, Eye, AlertCircle, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { formatNumber } from '@/lib/utils'
import { AIPoweredBadge } from '@/components/ui/ai-powered-badge'

interface ParsedIngredient {
  materialName: string
  unitContentMg: number
}

interface ParsedRecipe {
  recipeName: string
  description?: string
  ingredients: ParsedIngredient[]
  capsuleSize?: string
  capsuleColor?: string
  capsuleType?: string
  confidence?: '高' | '中' | '低'
  needsConfirmation?: boolean
}

interface SmartTemplateImportProps {
  onImport: (recipes: ParsedRecipe[]) => void
  disabled?: boolean
}

export function SmartTemplateImport({ onImport, disabled }: SmartTemplateImportProps) {
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importImages, setImportImages] = useState<string[]>([]) // 改為數組支持多圖
  const [isParsing, setIsParsing] = useState(false)
  const [parsingProgress, setParsingProgress] = useState({ current: 0, total: 0 }) // 解析進度
  const [parsedRecipes, setParsedRecipes] = useState<ParsedRecipe[]>([])
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | null>(null)
  const [importMode, setImportMode] = useState<'text' | 'image'>('image')
  const [isTemplateDragging, setIsTemplateDragging] = useState(false)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    processImageFiles(Array.from(files))
    event.target.value = ''
  }

  const processImageFiles = async (files: File[]) => {
    // 驗證文件
    const validFiles: File[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showToast({
          title: '跳過無效檔案',
          description: `${file.name} 不是圖片檔案。`,
          variant: 'destructive'
        })
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast({
          title: '檔案過大',
          description: `${file.name} 大小超過 10MB，已跳過。`,
          variant: 'destructive'
        })
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) {
      setIsTemplateDragging(false)
      return
    }

    setIsLoadingImage(true)
    setIsTemplateDragging(false)

    // 讀取所有有效圖片
    const imagePromises = validFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error(`無法讀取 ${file.name}`))
        reader.readAsDataURL(file)
      })
    })

    try {
      const results = await Promise.all(imagePromises)
      setImportImages(prev => [...prev, ...results])
      setImportMode('image')
      setIsLoadingImage(false)
      showToast({
        title: '圖片已載入',
        description: `已成功上傳 ${results.length} 張圖片，可以開始解析。`
      })
    } catch (error) {
      setIsLoadingImage(false)
      showToast({
        title: '讀取失敗',
        description: '部分圖片無法讀取，請重試。',
        variant: 'destructive'
      })
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsTemplateDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    if (
      event.clientX < rect.left ||
      event.clientX >= rect.right ||
      event.clientY < rect.top ||
      event.clientY >= rect.bottom
    ) {
      setIsTemplateDragging(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsTemplateDragging(false)
    
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      processImageFiles(Array.from(files))
    }
  }

  const handleParse = async () => {
    if (importMode === 'text' && !importText.trim()) {
      showToast({
        title: '缺少輸入',
        description: '請輸入要解析的配方文字',
        variant: 'destructive'
      })
      return
    }
    
    if (importMode === 'image' && importImages.length === 0) {
      showToast({
        title: '缺少圖片',
        description: '請上傳要解析的配方圖片',
        variant: 'destructive'
      })
      return
    }

    setIsParsing(true)
    setParsedRecipes([])
    setParsingProgress({ current: 0, total: importMode === 'image' ? importImages.length : 1 })

    try {
      let allRecipes: ParsedRecipe[] = []

      if (importMode === 'text') {
        // 文字模式：單次請求
        setParsingProgress({ current: 1, total: 1 })
        
        const response = await fetch('/api/ai/parse-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: importText.trim() })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `解析失敗 (${response.status})`)
        }

        const data = await response.json()
        if (data.success && data.data?.recipes) {
          allRecipes = data.data.recipes
        } else {
          throw new Error(data.error || '解析失敗')
        }
      } else {
        // 圖片模式：逐張解析
        for (let i = 0; i < importImages.length; i++) {
          setParsingProgress({ current: i + 1, total: importImages.length })
          
          showToast({
            title: '處理中',
            description: `正在解析第 ${i + 1} / ${importImages.length} 張圖片...`
          })

          const response = await fetch('/api/ai/parse-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: importImages[i] })
          })

          if (!response.ok) {
            console.error(`圖片 ${i + 1} 解析失敗`)
            continue // 跳過失敗的圖片，繼續處理下一張
          }

          const data = await response.json()
          if (data.success && data.data?.recipes) {
            allRecipes = [...allRecipes, ...data.data.recipes]
          }
        }
      }

      if (allRecipes.length === 0) {
        throw new Error('未能解析到任何配方，請檢查格式')
      }

      setParsedRecipes(allRecipes)
      showToast({
        title: '解析完成',
        description: importMode === 'image' 
          ? `從 ${importImages.length} 張圖片中成功解析 ${allRecipes.length} 個配方`
          : `成功解析 ${allRecipes.length} 個配方`
      })
    } catch (error) {
      console.error('Parse error:', error)
      showToast({
        title: '解析失敗',
        description: error instanceof Error ? error.message : '解析失敗，請稍後再試',
        variant: 'destructive'
      })
    } finally {
      setIsParsing(false)
      setParsingProgress({ current: 0, total: 0 })
    }
  }

  const handleConfirmImport = () => {
    if (parsedRecipes.length > 0) {
      try {
        onImport(parsedRecipes)
        showToast({
          title: '配方已提交',
          description: `正在導入 ${parsedRecipes.length} 個配方...`
        })
        
        setTimeout(() => {
          setIsOpen(false)
          resetState()
        }, 100)
      } catch (error) {
        console.error('Import error:', error)
        showToast({
          title: '導入失敗',
          description: error instanceof Error ? error.message : '導入配方時發生錯誤。',
          variant: 'destructive'
        })
      }
    }
  }

  const handleRemoveRecipe = (index: number) => {
    setParsedRecipes(prev => prev.filter((_, i) => i !== index))
    if (selectedRecipeIndex === index) {
      setSelectedRecipeIndex(null)
    }
    showToast({
      title: '已移除配方',
      description: '配方已從導入列表中移除。'
    })
  }

  const resetState = () => {
    setImportText('')
    setImportImages([])
    setImportMode('image') // 默認圖片模式
    setIsTemplateDragging(false)
    setParsedRecipes([])
    setSelectedRecipeIndex(null)
  }

  const removeImage = (index: number) => {
    setImportImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleCancel = () => {
    setIsOpen(false)
    resetState()
  }

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const selectedRecipe = selectedRecipeIndex !== null ? parsedRecipes[selectedRecipeIndex] : null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          智能導入模板
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            批量模板配方導入
          </DialogTitle>
          <DialogDescription>
            使用 AI 智能解析多個配方，支持文字和圖片輸入
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 模式選擇 */}
          <Card className="liquid-glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                選擇導入方式
                <AIPoweredBadge variant="minimal" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={importMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setImportMode('text')}
                  className="flex-1"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  文字輸入
                </Button>
                <Button
                  variant={importMode === 'image' ? 'default' : 'outline'}
                  onClick={() => setImportMode('image')}
                  className="flex-1"
                  size="sm"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  圖片上傳
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 文字輸入 */}
          {importMode === 'text' && (
            <Card className="liquid-glass-card">
              <CardHeader>
                <CardTitle className="text-base">輸入配方文字</CardTitle>
                <CardDescription className="text-xs">
                  每個配方之間用空行分隔，格式：配方名稱 + 原料列表
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="示例：&#10;&#10;配方1: 美白配方&#10;維生素C 500mg&#10;熊果苷 100mg&#10;煙酰胺 50mg&#10;&#10;配方2: 骨骼健康配方&#10;鈣 200mg&#10;維生素D3 1000IU&#10;鎂 100mg"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  disabled={isParsing}
                />
                
                <Button 
                  onClick={handleParse} 
                  disabled={isParsing || !importText.trim()}
                  className="w-full"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {parsingProgress.total > 0 
                        ? `AI 解析中 (${parsingProgress.current}/${parsingProgress.total})...`
                        : 'AI 解析中...'
                      }
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      開始解析配方
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 圖片上傳 */}
          {importMode === 'image' && (
            <Card className="liquid-glass-card">
              <CardHeader>
                <CardTitle className="text-base">上傳配方圖片</CardTitle>
                <CardDescription className="text-xs">
                  支援 JPG、PNG 格式，建議高解析度圖片
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingImage ? (
                  <div className="border-2 border-dashed rounded-xl p-12 text-center border-primary-300 bg-primary-50/50">
                    <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary-500 animate-spin" />
                    <p className="text-sm text-primary-700 font-medium">載入圖片中...</p>
                  </div>
                ) : importImages.length === 0 ? (
                  <>
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        isTemplateDragging
                          ? 'border-success-500 bg-success-50/50 scale-[1.02]'
                          : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50/50'
                      }`}
                      onDragEnter={(e) => { e.preventDefault(); setIsTemplateDragging(true) }}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <Upload className={`w-12 h-12 mx-auto mb-3 ${isTemplateDragging ? 'text-success-600' : 'text-neutral-400'}`} />
                      <p className={`font-medium ${isTemplateDragging ? 'text-success-700' : 'text-neutral-700'}`}>
                        {isTemplateDragging ? '放開以上傳圖片' : '拖放圖片至此'}
                      </p>
                      <p className="text-neutral-500 text-xs mt-2">支持多圖上傳 | 或點擊下方按鈕選擇文件</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={handleUploadClick}
                      className="w-full"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      選擇圖片文件（可多選）
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-success-50/80 rounded-lg p-3 border border-success-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success-500" />
                        <span className="text-sm font-medium text-success-700">已上傳 {importImages.length} 張圖片</span>
                      </div>
                      <Button
                        onClick={handleUploadClick}
                        variant="ghost"
                        size="sm"
                        className="text-success-600"
                      >
                        添加更多
                      </Button>
                    </div>
                    
                    {/* 圖片縮略圖列表 */}
                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                      {importImages.map((img, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden border border-neutral-200 group">
                          <Image
                            src={img}
                            alt={`配方圖片 ${index + 1}`}
                            width={400}
                            height={200}
                            className="w-full h-24 object-cover bg-neutral-50"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                            <Button
                              onClick={() => removeImage(index)}
                              variant="destructive"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  className="sr-only"
                  onChange={handleImageUpload}
                />
                
                <Button 
                  onClick={handleParse} 
                  disabled={isParsing || importImages.length === 0}
                  className="w-full"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {parsingProgress.total > 0 
                        ? `AI 解析中 (${parsingProgress.current}/${parsingProgress.total})...`
                        : 'AI 解析中...'
                      }
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      開始解析配方
                      {importImages.length > 0 && ` (${importImages.length} 張圖片)`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 解析結果 */}
          {parsedRecipes.length > 0 && (
            <Card className="liquid-glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">解析結果</CardTitle>
                  <Badge variant="default" className="bg-success-500">
                    {parsedRecipes.length} 個配方
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 配方列表 */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {parsedRecipes.map((recipe, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedRecipeIndex === index
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                        onClick={() => setSelectedRecipeIndex(index)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{recipe.recipeName}</h4>
                              {recipe.confidence && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    recipe.confidence === '高' ? 'border-success-300 text-success-700' :
                                    recipe.confidence === '中' ? 'border-warning-300 text-warning-700' :
                                    'border-danger-300 text-danger-700'
                                  }`}
                                >
                                  {recipe.confidence}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600">
                              {recipe.ingredients.length} 種原料
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedRecipeIndex(index)
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveRecipe(index)
                              }}
                              className="h-7 w-7 p-0 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 配方詳情 */}
                  <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                    {selectedRecipe ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">{selectedRecipe.recipeName}</h4>
                          {selectedRecipe.description && (
                            <p className="text-xs text-neutral-600 mb-2">{selectedRecipe.description}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium">原料清單</Label>
                          <div className="mt-1 space-y-1">
                            {selectedRecipe.ingredients.map((ing, idx) => (
                              <div key={idx} className="flex justify-between text-xs bg-white p-2 rounded border border-neutral-200">
                                <span className="font-medium">{ing.materialName}</span>
                                <span className="text-neutral-600">{formatNumber(ing.unitContentMg)} mg</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(selectedRecipe.capsuleSize || selectedRecipe.capsuleColor || selectedRecipe.capsuleType) && (
                          <div className="pt-2 border-t border-neutral-200">
                            <Label className="text-xs font-medium">膠囊規格</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedRecipe.capsuleSize && (
                                <Badge variant="outline" className="text-xs">{selectedRecipe.capsuleSize}</Badge>
                              )}
                              {selectedRecipe.capsuleColor && (
                                <Badge variant="outline" className="text-xs">{selectedRecipe.capsuleColor}</Badge>
                              )}
                              {selectedRecipe.capsuleType && (
                                <Badge variant="outline" className="text-xs">{selectedRecipe.capsuleType}</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-neutral-400 text-sm">
                        點擊左側配方查看詳情
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            {parsedRecipes.length > 0 && (
              <Button onClick={handleConfirmImport} className="bg-success-600 hover:bg-success-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                確認導入 {parsedRecipes.length} 個配方
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

