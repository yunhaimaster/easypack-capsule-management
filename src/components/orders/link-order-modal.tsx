'use client'

import { useState, useEffect, useCallback } from 'react'
import { LiquidGlassModal } from '@/components/ui/liquid-glass-modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Text } from '@/components/ui/text'
import { useToast } from '@/components/ui/toast-provider'
import { Search, Link2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { SourceType, LinkSuggestion } from '@/lib/link-suggestions'

interface LinkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  sourceType: SourceType
  sourceId: string
  sourceName: string
  currentLink?: { id: string; name: string } | null
  onLinkComplete: () => void
}

export function LinkOrderModal({
  isOpen,
  onClose,
  sourceType,
  sourceId,
  sourceName,
  currentLink,
  onLinkComplete
}: LinkOrderModalProps) {
  const { showToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [bestMatches, setBestMatches] = useState<LinkSuggestion[]>([])
  const [goodMatches, setGoodMatches] = useState<LinkSuggestion[]>([])
  const [searchResults, setSearchResults] = useState<LinkSuggestion[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<LinkSuggestion | null>(null)

  const targetType = sourceType === 'work-order' ? 'encapsulation-order' : 'work-order'
  const targetLabel = sourceType === 'work-order' ? '膠囊訂單' : '工作單'

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (search?: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        sourceType,
        sourceId,
        ...(search && { search })
      })

      const response = await fetch(`/api/link-suggestions?${params}`)
      const result = await response.json()

      if (result.success) {
        if (search) {
          // Search results
          const allResults = [...result.data.bestMatches, ...result.data.goodMatches]
          setSearchResults(allResults)
        } else {
          // Initial suggestions
          setBestMatches(result.data.bestMatches)
          setGoodMatches(result.data.goodMatches)
          setSearchResults([])
        }
      }
    } catch (error) {
      showToast({ title: '獲取建議失敗', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [sourceType, sourceId, showToast])

  // Debounced search
  useEffect(() => {
    if (!isOpen) return

    if (searchTerm) {
      const timer = setTimeout(() => {
        fetchSuggestions(searchTerm)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      // Reset to suggestions
      fetchSuggestions()
    }
  }, [searchTerm, isOpen, fetchSuggestions])

  // Initial load
  useEffect(() => {
    if (isOpen) {
      fetchSuggestions()
      setSearchTerm('')
      setShowConfirm(false)
      setSelectedTarget(null)
    }
  }, [isOpen, fetchSuggestions])

  const handleLinkClick = (target: LinkSuggestion) => {
    setSelectedTarget(target)
    setShowConfirm(true)
  }

  const handleConfirmLink = async () => {
    if (!selectedTarget) return

    setIsLinking(true)
    try {
      const endpoint = sourceType === 'work-order'
        ? `/api/work-orders/${sourceId}/link`
        : `/api/orders/${sourceId}/link`

      const bodyKey = sourceType === 'work-order' ? 'productionOrderId' : 'workOrderId'

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: selectedTarget.id })
      })

      const result = await response.json()

      if (result.success) {
        showToast({ title: '關聯成功' })
        onLinkComplete()
        onClose()
      } else {
        showToast({ title: result.error || '關聯失敗', variant: 'destructive' })
      }
    } catch (error) {
      showToast({ title: '關聯失敗', variant: 'destructive' })
    } finally {
      setIsLinking(false)
      setShowConfirm(false)
    }
  }

  const getMatchBadge = (score: number) => {
    if (score === 100) {
      return (
        <Badge variant="success" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          完全匹配
        </Badge>
      )
    }
    if (score === 50) {
      return (
        <Badge variant="warning" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          部分匹配
        </Badge>
      )
    }
    return null
  }

  const renderSuggestionItem = (item: LinkSuggestion) => (
    <button
      key={item.id}
      onClick={() => handleLinkClick(item)}
      className="w-full text-left p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-info-500 hover:bg-info-50 dark:hover:bg-info-900/20 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-neutral-900 dark:text-white/95 truncate">
            {item.name}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
            客戶：{item.customerName}
          </div>
          {item.person && (
            <div className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
              負責人：{item.person}
            </div>
          )}
        </div>
        {getMatchBadge(item.matchScore)}
      </div>
    </button>
  )

  return (
    <>
      <LiquidGlassModal
        isOpen={isOpen && !showConfirm}
        onClose={onClose}
        title={`關聯${targetLabel}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Current link info */}
          {currentLink && (
            <div className="p-3 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
              <Text.Secondary className="text-sm">
                目前關聯：<span className="font-medium text-info-700 dark:text-info-400">{currentLink.name}</span>
              </Text.Secondary>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder={`搜尋${targetLabel}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* Results */}
          {!isLoading && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {searchTerm ? (
                // Search results
                searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <Text.Secondary className="text-sm font-medium">
                      搜尋結果 ({searchResults.length})
                    </Text.Secondary>
                    {searchResults.map(renderSuggestionItem)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Text.Secondary>沒有找到匹配的{targetLabel}</Text.Secondary>
                  </div>
                )
              ) : (
                // Suggestions
                <>
                  {bestMatches.length > 0 && (
                    <div className="space-y-2">
                      <Text.Secondary className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success-600" />
                        最佳匹配 (客戶名稱 + 負責人)
                      </Text.Secondary>
                      {bestMatches.map(renderSuggestionItem)}
                    </div>
                  )}

                  {goodMatches.length > 0 && (
                    <div className="space-y-2">
                      <Text.Secondary className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning-600" />
                        其他匹配 (客戶名稱)
                      </Text.Secondary>
                      {goodMatches.map(renderSuggestionItem)}
                    </div>
                  )}

                  {bestMatches.length === 0 && goodMatches.length === 0 && (
                    <div className="text-center py-8">
                      <Text.Secondary>沒有找到建議的{targetLabel}</Text.Secondary>
                      <Text.Tertiary className="text-xs mt-2">
                        使用搜尋功能查找所有{targetLabel}
                      </Text.Tertiary>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </LiquidGlassModal>

      {/* Confirmation Modal */}
      <LiquidGlassModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="確認關聯"
        size="md"
      >
        {selectedTarget && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
              <Text.Primary className="font-medium mb-2">
                {sourceName}
              </Text.Primary>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-700" />
                <Link2 className="h-5 w-5 text-info-600" />
                <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-700" />
              </div>
              <Text.Primary className="font-medium">
                {selectedTarget.name}
              </Text.Primary>
              <Text.Secondary className="text-sm mt-1">
                {selectedTarget.customerName}
              </Text.Secondary>
            </div>

            {currentLink && currentLink.id !== selectedTarget.id && (
              <div className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                <Text.Secondary className="text-sm text-warning-700 dark:text-warning-400">
                  ⚠ 這將取消與「{currentLink.name}」的關聯
                </Text.Secondary>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1"
                disabled={isLinking}
              >
                取消
              </Button>
              <Button
                onClick={handleConfirmLink}
                className="flex-1"
                disabled={isLinking}
              >
                {isLinking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    確認關聯
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </LiquidGlassModal>
    </>
  )
}

