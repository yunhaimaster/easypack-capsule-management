/**
 * Manager Scheduling Table Page
 * 
 * Main page for the 經理排單表(膠囊) feature.
 * Displays scheduling entries in a table with drag-drop reordering.
 * Accessible by all users (view), editable by MANAGER/ADMIN only.
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { IconContainer } from '@/components/ui/icon-container'
import { Calendar, AlertCircle } from 'lucide-react'
import { SchedulingTable } from '@/components/manager-scheduling/scheduling-table'
import { ExportDialog } from '@/components/manager-scheduling/export-dialog'
import { ManagerSchedulingEntry } from '@/types/manager-scheduling'
import { useAuth } from '@/components/auth/auth-provider'

async function fetchSchedulingEntries(): Promise<ManagerSchedulingEntry[]> {
  try {
    const response = await fetch('/api/manager-scheduling', {
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '查詢排單表失敗' }))
      throw new Error(errorData.error || `HTTP ${response.status}: 查詢排單表失敗`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'API 返回失敗狀態')
    }
    
    if (!data.data || !data.data.entries) {
      throw new Error('API 回應缺少資料')
    }
    
    if (!Array.isArray(data.data.entries)) {
      throw new Error('無效的 API 回應格式：entries 不是陣列')
    }

    return data.data.entries || []
  } catch (error) {
    throw error
  }
}

function ManagerSchedulingContent() {
  const { isManager, isAdmin, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<ManagerSchedulingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const canEdit = isManager || isAdmin

  useEffect(() => {
    // Wait for auth to load before fetching entries
    if (authLoading) return

    async function loadEntries() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchSchedulingEntries()
        setEntries(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '載入失敗'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [authLoading])

  const handleExport = () => {
    setShowExportDialog(true)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <LiquidGlassNav />
        <main className="container mx-auto px-4 py-8 max-w-7xl pt-28 sm:pt-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        </main>
        <LiquidGlassFooter />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <LiquidGlassNav />
        <main className="container mx-auto px-4 py-8 max-w-7xl pt-28 sm:pt-24">
          <Card className="liquid-glass-card liquid-glass-card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-danger-600">
                <IconContainer icon={AlertCircle} variant="danger" size="md" />
                <p className="text-lg font-semibold">
                  錯誤：{error}
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
        <LiquidGlassFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <LiquidGlassNav />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl pt-28 sm:pt-24">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <IconContainer icon={Calendar} variant="primary" size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                經理排單表（膠囊）
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                管理膠囊生產工作單的優先順序和生產計劃
              </p>
            </div>
          </div>
        </div>

        {/* Table Section */}
        {entries.length === 0 ? (
          <Card className="liquid-glass-card liquid-glass-card-elevated">
            <CardContent className="p-12 text-center">
              <IconContainer icon={Calendar} variant="neutral" size="xl" className="mx-auto mb-4" />
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-2">
                排單表目前為空
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                {canEdit 
                  ? '您可以在工作單頁面將工作單加入排單表'
                  : '請聯繫經理或管理員新增工作單到排單表'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <SchedulingTable
            entries={entries}
            onEntriesChange={setEntries}
            canEdit={canEdit}
            onExport={canEdit ? handleExport : undefined}
          />
        )}

        {/* Export Dialog */}
        {showExportDialog && (
          <ExportDialog
            isOpen={showExportDialog}
            onClose={() => setShowExportDialog(false)}
            entries={entries}
          />
        )}
      </main>

      <LiquidGlassFooter />
    </div>
  )
}

export default function ManagerSchedulingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <LiquidGlassNav />
        <main className="container mx-auto px-4 py-8 max-w-7xl pt-28 sm:pt-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        </main>
        <LiquidGlassFooter />
      </div>
    }>
      <ManagerSchedulingContent />
    </Suspense>
  )
}
