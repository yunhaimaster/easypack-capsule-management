/**
 * Import Dialog Component
 * 
 * Multi-step wizard for importing work orders:
 * 1. Download template
 * 2. Upload file
 * 3. Validate and preview
 * 4. Confirm and import
 */

'use client'

import { useState, useRef } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Upload, Download, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { WORK_ORDER_COLUMNS } from '@/lib/export/xlsx-exporter'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
}

type ImportStep = 'upload' | 'validating' | 'preview' | 'importing' | 'success'

interface ValidationResult {
  valid: number
  invalid: number
  duplicates: number
  errors: Array<{ row: number; field: string; error: string }>
}

export function ImportDialog({ isOpen, onClose, onImportSuccess }: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; updated: number } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = () => {
    // Generate empty template with headers
    const headers = Object.values(WORK_ORDER_COLUMNS).join(',')
    const csvContent = '\uFEFF' + headers + '\n' // UTF-8 BOM
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `work-orders-template-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      handleValidate(selectedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0]
      
      // Validate file type
      const allowedTypes = ['.csv', '.xlsx', '.xls']
      const fileExtension = droppedFile.name.toLowerCase().substring(droppedFile.name.lastIndexOf('.'))
      
      if (allowedTypes.includes(fileExtension)) {
        setFile(droppedFile)
        setError(null)
        handleValidate(droppedFile)
      } else {
        setError('不支援的文件格式，請選擇 CSV 或 XLSX 文件')
      }
    }
  }

  const handleValidate = async (fileToValidate: File) => {
    setStep('validating')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', fileToValidate)
      formData.append('dryRun', 'true')

      const response = await fetch('/api/work-orders/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '驗證失敗')
      }

      const result = await response.json()
      
      if (result.success) {
        // Handle validation response structure
        const validation = result.validation || result.data
        setValidationResult({
          valid: validation.valid || 0,
          invalid: validation.errors || 0,
          duplicates: 0, // Not tracked in current validation
          errors: validation.details || []
        })
        setStep('preview')
      } else {
        throw new Error(result.error || '驗證失敗')
      }
    } catch (err) {
      console.error('Validation error:', err)
      setError(err instanceof Error ? err.message : '驗證失敗，請檢查文件格式')
      setStep('upload')
      setFile(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setStep('importing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dryRun', 'false')

      const response = await fetch('/api/work-orders/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '匯入失敗')
      }

      const result = await response.json()
      
      if (result.success) {
        // Handle import response structure
        const data = result.data
        setImportResult({
          created: data.imported || 0,
          updated: 0 // Not tracked in current implementation
        })
        setStep('success')
        
        // Call success callback after short delay
        setTimeout(() => {
          onImportSuccess()
          handleClose()
        }, 2000)
      } else {
        throw new Error(result.error || '匯入失敗')
      }
    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : '匯入失敗，請稍後重試')
      setStep('preview')
    }
  }

  const handleClose = () => {
    setStep('upload')
    setFile(null)
    setValidationResult(null)
    setError(null)
    setImportResult(null)
    setIsDragOver(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const renderUploadStep = () => (
    <>
      <div className="mb-6 p-4 bg-info-50 rounded-lg border border-info-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-info-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-info-700">
            <p className="font-medium mb-2">匯入須知：</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>請先下載模板，按照格式填寫資料</li>
              <li>支援 CSV 和 XLSX 格式</li>
              <li>必填欄位：客戶名稱、負責人、工作類型、工作描述</li>
              <li>日期格式：YYYY-MM-DD</li>
              <li>系統會自動檢測重複的訂單編號</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Download Template Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          下載匯入模板
        </Button>
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          上傳文件
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-primary-500 bg-primary-100/50'
              : 'border-neutral-300 hover:border-primary-400 hover:bg-primary-50/50'
          }`}
        >
          <Upload className={`h-12 w-12 mx-auto mb-3 ${
            isDragOver ? 'text-primary-600' : 'text-neutral-400'
          }`} />
          <p className={`text-sm mb-1 ${
            isDragOver ? 'text-primary-700 font-medium' : 'text-neutral-600'
          }`}>
            {isDragOver ? '放開文件以上傳' : '點擊選擇文件或拖放文件到此處'}
          </p>
          <p className="text-xs text-neutral-500">
            支援 CSV、XLSX 格式
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </>
  )

  const renderValidatingStep = () => (
    <div className="py-12 text-center">
      <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
      <p className="text-neutral-700 font-medium">正在驗證文件...</p>
      <p className="text-sm text-neutral-500 mt-2">請稍候</p>
    </div>
  )

  const renderPreviewStep = () => {
    if (!validationResult) return null

    const hasErrors = validationResult.invalid > 0 || validationResult.duplicates > 0

    return (
      <>
        {/* Validation Summary */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <span className="text-sm font-medium text-success-700">有效記錄</span>
            </div>
            <span className="text-lg font-bold text-success-700">{validationResult.valid}</span>
          </div>

          {validationResult.invalid > 0 && (
            <div className="flex items-center justify-between p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-danger-600" />
                <span className="text-sm font-medium text-danger-700">無效記錄</span>
              </div>
              <span className="text-lg font-bold text-danger-700">{validationResult.invalid}</span>
            </div>
          )}

          {validationResult.duplicates > 0 && (
            <div className="flex items-center justify-between p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning-600" />
                <span className="text-sm font-medium text-warning-700">重複記錄</span>
              </div>
              <span className="text-lg font-bold text-warning-700">{validationResult.duplicates}</span>
            </div>
          )}
        </div>

        {/* Error Details */}
        {validationResult.errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">錯誤詳情：</h3>
            <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg">
              {validationResult.errors.slice(0, 10).map((err, idx) => (
                <div key={idx} className="p-3 border-b border-neutral-100 last:border-b-0">
                  <p className="text-xs text-danger-700">
                    <strong>第 {err.row} 行</strong> - {err.field}: {err.error}
                  </p>
                </div>
              ))}
              {validationResult.errors.length > 10 && (
                <div className="p-3 text-center text-xs text-neutral-500">
                  還有 {validationResult.errors.length - 10} 個錯誤...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning Message */}
        {hasErrors && (
          <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-sm text-warning-700">
              ⚠️ 系統將只匯入有效的記錄，無效和重複的記錄將被跳過。
            </p>
          </div>
        )}
      </>
    )
  }

  const renderImportingStep = () => (
    <div className="py-12 text-center">
      <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
      <p className="text-neutral-700 font-medium">正在匯入工作單...</p>
      <p className="text-sm text-neutral-500 mt-2">請勿關閉此視窗</p>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="py-12 text-center">
      <CheckCircle className="h-16 w-16 text-success-600 mx-auto mb-4" />
      <p className="text-xl font-bold text-neutral-900 mb-2">匯入成功！</p>
      {importResult && (
        <div className="text-sm text-neutral-600 space-y-1">
          <p>成功創建 {importResult.created} 個工作單</p>
          {importResult.updated > 0 && <p>更新 {importResult.updated} 個工作單</p>}
        </div>
      )}
    </div>
  )

  return (
    <LiquidGlassModal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-neutral-900">匯入工作單</h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        )}

        {/* Step Content */}
        {step === 'upload' && renderUploadStep()}
        {step === 'validating' && renderValidatingStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'importing' && renderImportingStep()}
        {step === 'success' && renderSuccessStep()}

        {/* Actions */}
        {step !== 'validating' && step !== 'importing' && step !== 'success' && (
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              取消
            </Button>
            {step === 'preview' && validationResult && validationResult.valid > 0 && (
              <Button
                onClick={handleImport}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                確認匯入 ({validationResult.valid} 筆)
              </Button>
            )}
          </div>
        )}
      </div>
    </LiquidGlassModal>
  )
}

