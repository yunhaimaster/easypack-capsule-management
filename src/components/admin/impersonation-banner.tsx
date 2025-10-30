'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { IconContainer } from '@/components/ui/icon-container'
import { X, UserCircle, Shield } from 'lucide-react'

export function ImpersonationBanner() {
  const { isImpersonating, user, exitImpersonation } = useAuth()

  if (!isImpersonating || !user) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-warning-500 text-white p-3 rounded-lg shadow-lg flex items-center gap-3 max-w-xs">
        <UserCircle className="h-5 w-5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium">模擬身份中</p>
          <p className="text-xs opacity-90">您正在以 <span className="font-semibold">{user.nickname || user.phone} ({user.role})</span> 的身份瀏覽。</p>
        </div>
        <Button
          onClick={exitImpersonation}
          variant="secondary"
          size="sm"
          className="ml-auto bg-white text-warning-600 hover:bg-warning-50"
        >
          結束模擬
        </Button>
      </div>
    </div>
  )
}
