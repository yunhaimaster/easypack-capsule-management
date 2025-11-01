'use client'

import { useState } from 'react'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { Card } from '@/components/ui/card'
import { Users, Monitor, FileText, Shield, Smartphone, AlertTriangle } from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'
import { UserManagement } from './user-management'
import { SessionManagement } from './session-management'
import { TrustedDeviceManagement } from './trusted-device-management'
import { AuditLogViewer } from './audit-log-viewer'
import { ErrorLogViewer } from './error-log-viewer'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'

type Tab = 'users' | 'sessions' | 'devices' | 'logs' | 'errors'

export function AdminPageClient() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { isAdmin, isManager, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-elevation-0">
        <LiquidGlassNav />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-white/75">載入中...</p>
          </div>
        </div>
      </div>
    )
  }

  // Allow both ADMIN and MANAGER to access
  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-elevation-0">
        <LiquidGlassNav />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md p-8 text-center">
            <IconContainer icon={Shield} variant="danger" size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-white/95 mb-2">需要管理權限</h2>
            <p className="text-neutral-600 dark:text-white/75 mb-6">此頁面僅限管理員或經理訪問</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              返回首頁
            </button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-elevation-0">
      <LiquidGlassNav />
      
      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <IconContainer icon={Shield} variant="primary" size="md" />
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-white/95">系統管理</h1>
          </div>
          <p className="text-neutral-600 dark:text-white/75">管理用戶帳號、監控登入會話、查看系統審計日誌</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto overflow-y-hidden scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] flex-shrink-0 ${
              activeTab === 'users'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-surface-primary dark:bg-elevation-1 text-neutral-700 dark:text-white/85 hover:bg-neutral-50 dark:hover:bg-elevation-2'
            }`}
          >
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="leading-none text-sm sm:text-base">用戶管理</span>
          </button>
          
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] flex-shrink-0 ${
              activeTab === 'sessions'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-surface-primary dark:bg-elevation-1 text-neutral-700 dark:text-white/85 hover:bg-neutral-50 dark:hover:bg-elevation-2'
            }`}
          >
            <Monitor className="h-4 w-4 flex-shrink-0" />
            <span className="leading-none text-sm sm:text-base">活躍會話</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] flex-shrink-0 ${
              activeTab === 'devices'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-surface-primary dark:bg-elevation-1 text-neutral-700 dark:text-white/85 hover:bg-neutral-50 dark:hover:bg-elevation-2'
            }`}
          >
            <Smartphone className="h-4 w-4 flex-shrink-0" />
            <span className="leading-none text-sm sm:text-base">受信任設備</span>
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] flex-shrink-0 ${
              activeTab === 'logs'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-surface-primary dark:bg-elevation-1 text-neutral-700 dark:text-white/85 hover:bg-neutral-50 dark:hover:bg-elevation-2'
            }`}
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="leading-none text-sm sm:text-base">審計日誌</span>
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] flex-shrink-0 ${
              activeTab === 'errors'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-surface-primary dark:bg-elevation-1 text-neutral-700 dark:text-white/85 hover:bg-neutral-50 dark:hover:bg-elevation-2'
            }`}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="leading-none text-sm sm:text-base">錯誤監控</span>
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'users' && (
            <UserManagement 
              onSelectUser={(userId) => {
                setSelectedUserId(userId)
                setActiveTab('sessions') // 切換到活躍會話頁
              }}
            />
          )}
          {activeTab === 'sessions' && (
            <SessionManagement 
              selectedUserId={selectedUserId}
              onClearFilter={() => setSelectedUserId(null)}
            />
          )}
          {activeTab === 'devices' && (
            <TrustedDeviceManagement 
              selectedUserId={selectedUserId}
              onClearFilter={() => setSelectedUserId(null)}
            />
          )}
          {activeTab === 'logs' && (
            <AuditLogViewer 
              selectedUserId={selectedUserId}
              onClearFilter={() => setSelectedUserId(null)}
            />
          )}
          {activeTab === 'errors' && (
            <ErrorLogViewer 
              selectedUserId={selectedUserId}
              onClearFilter={() => setSelectedUserId(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

