'use client'

import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { IconContainer } from '@/components/ui/icon-container'
import { Button } from '@/components/ui/button'
import { Tag, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { VERSION_HISTORY } from '@/data/version-history'

export default function HistoryPage() {
  // Use centralized version history data (single source of truth)
  const versionHistory = VERSION_HISTORY

  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      
      {/* Main Content with padding for fixed nav */}
      <div className="pt-28 sm:pt-24 px-4 sm:px-6 md:px-8 space-y-8 floating-combined">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回首頁
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-2xl font-bold text-neutral-800 dark:text-white/95">
              版本更新歷史
            </h1>
          </div>
          <p className="text-neutral-600 dark:text-white/75 text-sm sm:text-sm">
            Easy Health 膠囊管理系統的完整更新記錄
          </p>
        </div>

        {/* Version History */}
        <div className="space-y-6">
          {versionHistory.map((version, index) => (
            <div key={version.version} className="liquid-glass-card liquid-glass-card-elevated liquid-glass-card-interactive">
              <div className="liquid-glass-content">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <IconContainer icon={Tag} variant="primary" size="md" />
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-800 dark:text-white/95">
                        {version.version}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-neutral-500 dark:text-white/65" />
                        <span className="text-sm text-neutral-600 dark:text-white/75">{version.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${version.typeColor}`}>
                    {version.type}
                  </span>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-neutral-700 dark:text-white/85">更新內容：</h4>
                  <ul className="space-y-2">
                    {version.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-neutral-600 dark:text-white/75">
                        <span className="text-primary-500 mt-0.5">{feature.slice(0, 2)}</span>
                        <span>{feature.slice(3)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <LiquidGlassFooter />
    </div>
  )
}
