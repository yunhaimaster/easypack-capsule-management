'use client'

import { useState } from 'react'
import { Settings, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AISettingsProps {
  enableReasoning: boolean
  onToggleReasoning: (enabled: boolean) => void
}

export function AISettings({ enableReasoning, onToggleReasoning }: AISettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="liquid-glass-modal-close"
        onClick={() => setIsOpen(!isOpen)}
        title="AI 設置"
        type="button"
      >
        <Settings className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Settings Panel */}
          <div className="absolute right-0 top-8 z-50 liquid-glass-dropdown p-4 min-w-[340px] max-w-[400px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-100">AI 設置</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  ×
                </Button>
              </div>

              {/* Reasoning Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neutral-700 dark:text-white/85 font-medium">深度分析模式</span>
                    <AlertTriangle className="h-3 w-3 text-warning-500" />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableReasoning}
                      onChange={(e) => onToggleReasoning(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {/* Info Box */}
                <div className="bg-primary-50/80 border border-primary-200/60 rounded-lg p-3 space-y-2">
                  <div className="text-xs text-primary-900">
                    <p className="font-semibold mb-2 text-sm">🤖 什麼是深度分析模式？</p>
                    <p className="leading-relaxed mb-2">
                      AI 會像專家一樣，在回答前先仔細思考，然後給您更詳細、更準確的分析報告。
                    </p>
                  </div>
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Standard Mode */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-neutral-700 dark:text-white/85 mb-1.5">⚡ 標準模式（預設）</p>
                    <ul className="text-xs text-neutral-600 dark:text-white/75 space-y-1">
                      <li>✓ 快速回應</li>
                      <li>✓ 適合一般問題</li>
                      <li>✓ 簡潔明瞭</li>
                    </ul>
                  </div>
                  
                  {/* Deep Mode */}
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-warning-800 mb-1.5">🔍 深度分析模式</p>
                    <ul className="text-xs text-warning-700 space-y-1">
                      <li>✓ 更詳細分析</li>
                      <li>✓ 顯示思考過程</li>
                      <li>⚠️ 等待時間較長</li>
                    </ul>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                  <div className="text-xs text-success-800">
                    <p className="font-semibold mb-1">💡 建議使用時機</p>
                    <p className="leading-relaxed">
                      <strong>開啟深度分析</strong>適合：配方分析、合規檢查、複雜問題
                    </p>
                    <p className="leading-relaxed mt-1">
                      <strong>使用標準模式</strong>適合：簡單查詢、快速提問、一般諮詢
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
