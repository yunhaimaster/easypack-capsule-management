'use client'

import { useState } from 'react'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconContainer } from '@/components/ui/icon-container'
import { CheckCircle, XCircle, Loader2, Database, Settings } from 'lucide-react'
import Link from 'next/link'

export default function SetupPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [createResult, setCreateResult] = useState<{
    success: boolean
    message: string
    tables?: string[]
    error?: string
  } | null>(null)

  const handleCreateTables = async () => {
    setIsCreating(true)
    setCreateResult(null)

    try {
      const response = await fetch('/api/create-v2-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setCreateResult(data)
    } catch (error) {
      setCreateResult({
        success: false,
        message: '創建失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen brand-logo-pattern-bg">
      <LiquidGlassNav />
      
      <div className="container mx-auto px-4 pt-28 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* 頁面標題 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-neutral-800 dark:text-white/95 mb-4">
              🛠️ 數據庫設置
            </h1>
            <p className="text-lg text-neutral-600 dark:text-white/75">
              設置 v2.0 功能所需的數據庫表
            </p>
          </div>

          {/* 設置說明 */}
          <Card className="liquid-glass-card liquid-glass-card-elevated mb-8">
            <div className="liquid-glass-content">
              <div className="flex items-center space-x-3 mb-6">
                <IconContainer icon={Settings} variant="primary" size="md" />
                <h2 className="text-xl font-semibold text-neutral-800 dark:text-white/95">設置說明</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-primary-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-primary-800 mb-2">為什麼需要設置？</h3>
                  <p className="text-primary-700 text-sm">
                    v2.0 功能（AI配方生成、工作單生成等）需要特定的數據庫表來保存數據。
                    如果沒有設置，這些功能只能臨時保存數據。
                  </p>
                </div>

                <div className="bg-success-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-success-800 mb-2">設置後的效果</h3>
                  <ul className="text-success-700 text-sm space-y-1">
                    <li>• AI生成的配方將被永久保存</li>
                    <li>• 工作單可以保存到數據庫</li>
                    <li>• 原料價格數據可以存儲</li>
                    <li>• 所有v2.0功能將正常工作</li>
                  </ul>
                </div>

                <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-warning-800 dark:text-warning-200 mb-2">注意事項</h3>
                  <p className="text-warning-700 dark:text-warning-300 text-sm">
                    此操作將在您的數據庫中創建新的表。請確保您有數據庫的管理權限。
                    如果表已存在，操作將安全地跳過。
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 創建表按鈕 */}
          <Card className="liquid-glass-card liquid-glass-card-elevated mb-8">
            <div className="liquid-glass-content">
              <div className="flex items-center space-x-3 mb-6">
                <IconContainer icon={Database} variant="success" size="md" />
                <h2 className="text-xl font-semibold text-neutral-800 dark:text-white/95">創建數據庫表</h2>
              </div>

              <div className="text-center">
                <Button
                  onClick={handleCreateTables}
                  disabled={isCreating}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      創建中...
                    </>
                  ) : (
                    <>
                      <Database className="h-5 w-5 mr-2" />
                      創建 v2.0 數據庫表
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* 結果顯示 */}
          {createResult && (
            <Card className={`liquid-glass-card liquid-glass-card-elevated ${
              createResult.success ? 'liquid-glass-card-success' : 'liquid-glass-card-warning'
            }`}>
              <div className="liquid-glass-content">
                <div className="flex items-center space-x-3 mb-4">
                  {createResult.success ? (
                    <CheckCircle className="h-6 w-6 text-success-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-danger-600" />
                  )}
                  <h3 className={`text-lg font-semibold ${
                    createResult.success ? 'text-success-800' : 'text-danger-800'
                  }`}>
                    {createResult.success ? '設置成功' : '設置失敗'}
                  </h3>
                </div>

                <div className="space-y-3">
                  <p className={createResult.success ? 'text-success-700' : 'text-danger-700'}>
                    {createResult.message}
                  </p>

                  {createResult.tables && createResult.tables.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-800 dark:text-white/95 mb-2">已創建的表：</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {createResult.tables.map((table, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success-500" />
                            <span className="text-neutral-700 dark:text-white/85">{table}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {createResult.error && (
                    <div className="bg-danger-50 p-3 rounded-lg">
                      <h4 className="font-medium text-danger-800 mb-1">錯誤詳情：</h4>
                      <p className="text-danger-700 text-sm">{createResult.error}</p>
                    </div>
                  )}
                </div>

                {createResult.success && (
                  <div className="mt-6 pt-4 border-t border-neutral-200">
                    <div className="bg-primary-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-primary-800 mb-2">設置完成！</h4>
                      <p className="text-primary-700 text-sm">
                        數據庫表已成功創建。如果AI配方生成器仍顯示&ldquo;數據庫未設置&rdquo;，
                        請點擊該頁面的&ldquo;刷新狀態&rdquo;按鈕或重新載入頁面。
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href="/ai-recipe-generator">
                        <Button className="w-full sm:w-auto">
                          測試 AI 配方生成器
                        </Button>
                      </Link>
                      <Link href="/marketing-assistant">
                        <Button variant="outline" className="w-full sm:w-auto">
                          測試行銷設計助手
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 返回首頁 */}
          <div className="text-center">
            <Link href="/">
              <Button variant="outline">
                返回首頁
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
