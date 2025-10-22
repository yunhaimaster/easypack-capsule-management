'use client'

import { useState } from 'react'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { Card } from '@/components/ui/card'
import { Users, Monitor, FileText, Shield } from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'
import { UserManagement } from './user-management'
import { DeviceManagement } from './device-management'
import { AuditLogViewer } from './audit-log-viewer'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'

type Tab = 'users' | 'devices' | 'logs'

export function AdminPageClient() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { isAdmin, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LiquidGlassNav />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-neutral-600">載入中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LiquidGlassNav />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md p-8 text-center">
            <IconContainer icon={Shield} variant="danger" size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">需要管理員權限</h2>
            <p className="text-neutral-600 mb-6">您沒有權限訪問此頁面</p>
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
    <div className="min-h-screen bg-gray-50">
      <LiquidGlassNav />
      
      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <IconContainer icon={Shield} variant="primary" size="md" />
            <h1 className="text-2xl font-bold text-neutral-800">系統管理</h1>
          </div>
          <p className="text-neutral-600">管理用戶、監控設備、查看審計日誌</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-neutral-700 hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            用戶管理
          </button>
          
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'devices'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-neutral-700 hover:bg-gray-50'
            }`}
          >
            <Monitor className="h-4 w-4" />
            設備監控
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-neutral-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            審計日誌
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'users' && (
            <UserManagement 
              onSelectUser={(userId) => {
                setSelectedUserId(userId)
                setActiveTab('devices') // 切換到設備監控頁
              }}
            />
          )}
          {activeTab === 'devices' && (
            <DeviceManagement 
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
        </div>
      </div>
    </div>
  )
}

