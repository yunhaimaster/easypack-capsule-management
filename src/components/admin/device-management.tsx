'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Monitor, Smartphone, Trash2, Clock, MapPin, X, Filter } from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'

interface Session {
  id: string
  userId: string
  createdAt: string
  expiresAt: string
  userAgent: string | null
  ip: string | null
  user: {
    id: string
    phoneE164: string
    nickname: string | null
    role: string
  }
}

interface Device {
  id: string
  userId: string
  createdAt: string
  lastSeenAt: string
  expiresAt: string
  userAgent: string | null
  ipFirstUsed: string | null
  user: {
    id: string
    phoneE164: string
    nickname: string | null
    role: string
  }
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown', browser: 'Unknown' }
  
  let device = 'Desktop'
  if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile'
  if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet'
  
  let browser = 'Unknown'
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edge')) browser = 'Edge'
  
  return { device, browser }
}

interface DeviceManagementProps {
  selectedUserId?: string | null
  onClearFilter?: () => void
}

export function DeviceManagement({ selectedUserId, onClearFilter }: DeviceManagementProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserPhone, setSelectedUserPhone] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [selectedUserId])

  const loadData = async () => {
    try {
      setLoading(true)
      const url = selectedUserId 
        ? `/api/admin/devices?userId=${selectedUserId}`
        : '/api/admin/devices'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions)
        setDevices(data.devices)
        
        // 獲取用戶電話號碼（用於顯示篩選標題）
        if (selectedUserId && (data.sessions.length > 0 || data.devices.length > 0)) {
          const phone = data.sessions[0]?.user?.phoneE164 || data.devices[0]?.user?.phoneE164
          setSelectedUserPhone(phone || '')
        } else {
          setSelectedUserPhone('')
        }
      }
    } catch (error) {
      console.error('載入設備失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const revokeSession = async (id: string) => {
    if (!confirm('確定要撤銷此會話嗎？用戶將需要重新登入。')) return

    try {
      const res = await fetch(`/api/admin/devices/${id}?type=session`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setSessions(sessions.filter(s => s.id !== id))
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('撤銷會話失敗:', error)
      alert('撤銷失敗')
    }
  }

  const revokeDevice = async (id: string) => {
    if (!confirm('確定要撤銷此受信任設備嗎？用戶下次登入需要重新驗證。')) return

    try {
      const res = await fetch(`/api/admin/devices/${id}?type=device`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setDevices(devices.filter(d => d.id !== id))
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('撤銷設備失敗:', error)
      alert('撤銷失敗')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        <p className="mt-4 text-neutral-600 dark:text-white/75">載入中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      {selectedUserId && selectedUserPhone && (
        <Card className="p-4 bg-info-50 border-info-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-info-600" />
              <span className="font-medium text-info-800">
                正在查看用戶：{selectedUserPhone}
              </span>
            </div>
            {onClearFilter && (
              <button
                onClick={onClearFilter}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-info-700 hover:bg-info-100 rounded transition-colors"
              >
                <X className="h-4 w-4" />
                顯示全部
              </button>
            )}
          </div>
        </Card>
      )}
      
      {/* Active Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95 mb-4">
          活躍會話 ({sessions.length})
        </h2>
        <div className="grid gap-4">
          {sessions.map((session) => {
            const { device, browser } = parseUserAgent(session.userAgent)
            const expiresIn = Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
            
            return (
              <Card key={session.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <IconContainer 
                      icon={device === 'Mobile' ? Smartphone : Monitor} 
                      variant="primary" 
                      size="md" 
                    />
                    <div className="flex-1">
                      <div className="font-medium text-neutral-800 dark:text-white/95 mb-1">
                        {session.user.nickname ? (
                          <>
                            <span>{session.user.nickname}</span>
                            <span className="text-sm text-neutral-500 dark:text-white/65 ml-2">{session.user.phoneE164}</span>
                          </>
                        ) : (
                          session.user.phoneE164
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-white/75">
                        <div>{browser} · {device}</div>
                        {session.ip && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {session.ip}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {expiresIn > 0 ? `${expiresIn}小時後過期` : '已過期'}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-white/65 mt-1">
                        登入時間: {new Date(session.createdAt).toLocaleString('zh-HK')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => revokeSession(session.id)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                    title="撤銷會話"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
        {sessions.length === 0 && (
          <Card className="p-8 text-center">
            <Monitor className="h-12 w-12 text-neutral-300 dark:text-white/55 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-white/75">暫無活躍會話</p>
          </Card>
        )}
      </div>

      {/* Trusted Devices */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95 mb-4">
          受信任設備 ({devices.length})
        </h2>
        <div className="grid gap-4">
          {devices.map((device) => {
            const { device: deviceType, browser } = parseUserAgent(device.userAgent)
            const expiresIn = Math.ceil((new Date(device.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            
            return (
              <Card key={device.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <IconContainer 
                      icon={deviceType === 'Mobile' ? Smartphone : Monitor} 
                      variant="success" 
                      size="md" 
                    />
                    <div className="flex-1">
                      <div className="font-medium text-neutral-800 dark:text-white/95 mb-1">
                        {device.user.nickname ? (
                          <>
                            <span>{device.user.nickname}</span>
                            <span className="text-sm text-neutral-500 dark:text-white/65 ml-2">{device.user.phoneE164}</span>
                          </>
                        ) : (
                          device.user.phoneE164
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-white/75">
                        <div>{browser} · {deviceType}</div>
                        {device.ipFirstUsed && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {device.ipFirstUsed}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {expiresIn}天後過期
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-white/65 mt-1">
                        創建: {new Date(device.createdAt).toLocaleString('zh-HK')} · 
                        最後使用: {new Date(device.lastSeenAt).toLocaleString('zh-HK')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => revokeDevice(device.id)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                    title="撤銷設備"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
        {devices.length === 0 && (
          <Card className="p-8 text-center">
            <Smartphone className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-white/75">暫無受信任設備</p>
          </Card>
        )}
      </div>
    </div>
  )
}

