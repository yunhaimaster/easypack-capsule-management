'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddWorklogDialog } from './add-worklog-dialog'

const ResponsiveWorklogsList = dynamic(() => import('@/components/worklogs/responsive-worklogs-list').then((mod) => mod.ResponsiveWorklogsList), {
  ssr: false,
  loading: () => <div className="text-center text-sm text-neutral-500 dark:text-white/65 py-12" aria-live="polite">工時資料載入中…</div>,
})

export function WorklogsPageClient() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  const handleAddSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />

      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 floating-combined">
        <section className="liquid-glass-card liquid-glass-card-refraction liquid-glass-card-interactive p-6 md:p-8">
          <div className="liquid-glass-content flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="icon-container icon-container-gradient-indigo shadow-[0_12px_30px_rgba(79,70,229,0.25)]">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg md:text-lg font-semibold text-[--brand-neutral] tracking-tight">工時記錄</h1>
                <p className="text-xs md:text-xs text-neutral-600 dark:text-white/75">查看最新工時安排、快速篩選調整與匯出記錄</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-300/40 text-indigo-700 text-sm font-medium leading-none">最新工時優先</span>
              <span className="px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-300/40 text-purple-700 text-sm font-medium leading-none">訂單交叉查看</span>
            </div>
          </div>
        </section>

        <ResponsiveWorklogsList key={refreshKey} />
      </div>

      {/* 浮动添加按钮 */}
      <Button
        onClick={() => setShowAddDialog(true)}
        className="fixed bottom-6 right-6 z-[9999] h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white border-0 ripple-effect btn-micro-hover"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          height: '64px',
          width: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          border: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out'
        }}
        aria-label="添加工時記錄"
      >
        <Plus className="h-7 w-7" />
      </Button>

      {/* 添加工时对话框 */}
      <AddWorklogDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddSuccess}
      />

      <LiquidGlassFooter />
    </div>
  )
}
