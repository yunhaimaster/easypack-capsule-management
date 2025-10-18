'use client'

import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const { logout } = useAuth()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={logout}
      className="h-8 w-8 p-0"
      title="登出系統"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  )
}
