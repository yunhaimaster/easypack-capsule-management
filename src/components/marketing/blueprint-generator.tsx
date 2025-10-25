'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

interface BlueprintGeneratorProps {
  productName?: string
  ingredients?: Array<{ materialName: string; unitContentMg: number }>
  colorScheme?: string
}

export function BlueprintGenerator({ productName = '產品名稱', ingredients = [], colorScheme = '#7C3AED' }: BlueprintGeneratorProps) {
  const { showToast } = useToast()
  const [svgPreview, setSvgPreview] = useState<string | null>(null)

  const generateSVG = () => {
    const width = 140 // mm
    const height = 60 // mm
    const bleed = 2 // mm
    const safeZone = 3 // mm
    
    const totalWidth = width + bleed * 2
    const totalHeight = height + bleed * 2

    const mainIngredients = ingredients.slice(0, 3)
    const ingredientText = mainIngredients.length > 0
      ? mainIngredients.map(ing => `${ing.materialName} ${ing.unitContentMg}mg`).join(' • ')
      : '主要成分與含量'

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalWidth}mm" height="${totalHeight}mm" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- 出血區域 (紅色參考線) -->
  <rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="white" stroke="red" stroke-width="0.1" stroke-dasharray="1,1"/>
  
  <!-- 安全區域 (綠色參考線) -->
  <rect x="${bleed + safeZone}" y="${bleed + safeZone}" width="${width - safeZone * 2}" height="${height - safeZone * 2}" fill="none" stroke="green" stroke-width="0.1" stroke-dasharray="1,1"/>
  
  <!-- 實際標籤區域 -->
  <rect x="${bleed}" y="${bleed}" width="${width}" height="${height}" fill="white" stroke="${colorScheme}" stroke-width="0.5"/>
  
  <!-- 頂部品牌區 -->
  <rect x="${bleed}" y="${bleed}" width="${width}" height="12" fill="${colorScheme}" fill-opacity="0.1"/>
  <text x="${bleed + width / 2}" y="${bleed + 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="5" font-weight="bold" fill="${colorScheme}">EASY HEALTH</text>
  
  <!-- 產品名稱區 -->
  <text x="${bleed + width / 2}" y="${bleed + 22}" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#1F2937">${productName}</text>
  
  <!-- 功效標語區 -->
  <text x="${bleed + width / 2}" y="${bleed + 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.5" fill="#6B7280">支持健康 • 科學配方 • 安心品質</text>
  
  <!-- 主要成分區 -->
  <text x="${bleed + width / 2}" y="${bleed + 38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="2.8" fill="#374151">${ingredientText}</text>
  
  <!-- 使用方法區 -->
  <text x="${bleed + 5}" y="${bleed + 45}" font-family="Arial, sans-serif" font-size="2.5" fill="#4B5563">建議用法：每日2粒，飯後溫水送服</text>
  
  <!-- 警示語區 -->
  <text x="${bleed + 5}" y="${bleed + 50}" font-family="Arial, sans-serif" font-size="2.2" fill="#DC2626">注意：此產品並非藥物，不能替代藥物治療</text>
  
  <!-- 底部資訊區 -->
  <rect x="${bleed}" y="${bleed + height - 8}" width="${width}" height="8" fill="${colorScheme}" fill-opacity="0.05"/>
  <text x="${bleed + 5}" y="${bleed + height - 3}" font-family="Arial, sans-serif" font-size="2" fill="#6B7280">淨含量：60粒 | 香港製造 | QR碼追溯</text>
  
  <!-- QR 碼佔位 -->
  <rect x="${bleed + width - 15}" y="${bleed + height - 15}" width="10" height="10" fill="none" stroke="${colorScheme}" stroke-width="0.3"/>
  <text x="${bleed + width - 10}" y="${bleed + height - 7}" text-anchor="middle" font-family="Arial, sans-serif" font-size="1.8" fill="${colorScheme}">QR</text>
  
  <!-- 尺寸標註 (參考用) -->
  <text x="1" y="3" font-family="Arial, sans-serif" font-size="1.5" fill="red">出血: ${bleed}mm</text>
  <text x="1" y="6" font-family="Arial, sans-serif" font-size="1.5" fill="green">安全: ${safeZone}mm</text>
  <text x="1" y="9" font-family="Arial, sans-serif" font-size="1.5" fill="black">尺寸: ${width}×${height}mm</text>
</svg>`

    setSvgPreview(svg)
    showToast({
      title: '設計圖紙已生成',
      description: '可預覽並下載 SVG 或 PNG 格式',
      variant: 'default'
    })
  }

  const downloadSVG = () => {
    if (!svgPreview) return

    const blob = new Blob([svgPreview], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `packaging-blueprint-${Date.now()}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadPNG = () => {
    if (!svgPreview) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    const blob = new Blob([svgPreview], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      canvas.width = img.width * 3 // 3x resolution
      canvas.height = img.height * 3
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return
        const pngUrl = URL.createObjectURL(pngBlob)
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `packaging-blueprint-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(pngUrl)
      }, 'image/png')

      URL.revokeObjectURL(url)
    }

    img.src = url
  }

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated" interactive={false}>
      <div className="liquid-glass-content">
        <div className="flex items-center gap-3 mb-6">
          <div className="icon-container icon-container-blue">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95">包裝設計圖紙</h2>
            <p className="text-sm text-neutral-500 dark:text-white/65">生成可編輯的 SVG 標籤設計藍圖（含出血與安全區）</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={generateSVG}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            生成設計圖紙
          </Button>

          {svgPreview && (
            <div className="space-y-3">
              <Badge variant="outline" className="text-xs">
                設計圖紙已生成 (140×60mm + 2mm出血)
              </Badge>
              
              <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 p-4">
                <div dangerouslySetInnerHTML={{ __html: svgPreview }} className="w-full" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={downloadSVG}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  下載 SVG
                </Button>
                <Button
                  onClick={downloadPNG}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  下載 PNG
                </Button>
              </div>

              <div className="text-xs text-neutral-500 dark:text-white/65 bg-neutral-50 p-3 rounded border border-neutral-100">
                <p className="font-medium mb-1">設計規格說明：</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>標籤尺寸：140mm × 60mm</li>
                  <li>出血區域：2mm（紅色虛線）</li>
                  <li>安全區域：3mm（綠色虛線）</li>
                  <li>可使用 Adobe Illustrator 或 Inkscape 編輯 SVG</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

