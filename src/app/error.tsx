'use client'

import { useEffect } from 'react'
import { getClientErrorLogger } from '@/lib/client-error-logger'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to database
    const logger = getClientErrorLogger()
    logger(error, { digest: error.digest, boundary: 'global' })
  }, [error])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-elevation-0 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-danger-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white/95 mb-2">
          發生錯誤
        </h2>
        <p className="text-neutral-600 dark:text-white/75 mb-6">
          系統遇到問題，已自動記錄錯誤。請稍後再試。
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-elevation-1 rounded-lg text-left">
            <p className="text-xs font-mono text-danger-600 dark:text-danger-400 break-words">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            重試
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="secondary"
          >
            返回首頁
          </Button>
        </div>
      </Card>
    </div>
  )
}

