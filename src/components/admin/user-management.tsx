'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Phone, Calendar, Shield, Check, X, Eye } from 'lucide-react'
import { IconContainer } from '@/components/ui/icon-container'

interface User {
  id: string
  phoneE164: string
  nickname?: string | null
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
  createdAt: string
  updatedAt: string
  _count: {
    sessions: number
    devices: number
    auditLogs: number
  }
}

const roleColors = {
  ADMIN: 'text-danger-600 bg-danger-50 border-danger-200',
  MANAGER: 'text-warning-600 bg-warning-50 border-warning-200',
  EMPLOYEE: 'text-neutral-600 dark:text-white/75 bg-neutral-50 border-neutral-200',
}

const roleNames = {
  ADMIN: '管理員',
  MANAGER: '經理',
  EMPLOYEE: '員工',
}

interface UserManagementProps {
  onSelectUser?: (userId: string) => void
}

export function UserManagement({ onSelectUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('EMPLOYEE')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('EMPLOYEE')
  const [editingNickname, setEditingNickname] = useState<string | null>(null)
  const [nicknameValue, setNicknameValue] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('載入用戶失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const addUser = async () => {
    try {
      // Remove ALL whitespace and non-visible characters
      let phone = newPhone
        .replace(/\s+/g, '')  // Remove all spaces (including &nbsp;, tabs, newlines)
        .replace(/\u200B/g, '')  // Remove zero-width spaces
        .replace(/\u200C/g, '')  // Remove zero-width non-joiner
        .replace(/\u200D/g, '')  // Remove zero-width joiner
        .replace(/\uFEFF/g, '')  // Remove BOM
        .replace(/\u202A/g, '')  // Remove left-to-right embedding
        .replace(/\u202C/g, '')  // Remove pop directional formatting
        .replace(/[\u0000-\u001F]/g, '')  // Remove control characters
        .trim()
      
      console.log('[Debug] Original input:', JSON.stringify(newPhone))
      console.log('[Debug] Original length:', newPhone.length)
      console.log('[Debug] Original bytes:', Array.from(newPhone).map(c => c.charCodeAt(0).toString(16)).join(' '))
      console.log('[Debug] Cleaned phone:', phone)
      console.log('[Debug] Cleaned length:', phone.length)
      
      // Validate input
      if (!phone) {
        alert('請輸入電話號碼')
        return
      }
      
      // Auto-prepend +852 for Hong Kong 8-digit numbers
      if (phone.length === 8 && /^\d{8}$/.test(phone)) {
        phone = `+852${phone}`
        console.log('[Debug] Added +852, now:', phone)
      } else if (phone.startsWith('+')) {
        // Already has +, just validate
        console.log('[Debug] Already has +, validating...')
      } else {
        // Not 8 digits and no +
        console.log('[Debug] Failed - not 8 digits and no +')
        alert(`請輸入有效的電話號碼（8位數字或完整國際格式）\n\n您輸入的是: "${phone}"\n長度: ${phone.length}\n是否8位數字: ${/^\d{8}$/.test(phone)}`)
        return
      }
      
      // Validate E.164 format
      if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
        console.log('[Debug] Failed E.164 validation:', phone)
        alert(`電話號碼格式不正確\n\n號碼: ${phone}\n請確保格式為 +[國碼][號碼]`)
        return
      }
      
      console.log('[Debug] Validation passed, sending:', phone)

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneE164: phone, role: newRole })
      })

      const data = await res.json()
      if (data.success) {
        setUsers([data.user, ...users])
        setShowAddForm(false)
        setNewPhone('')
        setNewRole('EMPLOYEE')
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('添加用戶失敗:', error)
      alert('添加用戶失敗')
    }
  }

  const updateRole = async (userId: string, role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      const data = await res.json()
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
        setEditingUser(null)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('更新角色失敗:', error)
      alert('更新角色失敗')
    }
  }

  const updateNickname = async (userId: string, nickname: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() || null })
      })

      const data = await res.json()
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, nickname: nickname.trim() || null } : u))
        setEditingNickname(null)
        setNicknameValue('')
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('更新暱稱失敗:', error)
      alert('更新暱稱失敗')
    }
  }

  const deleteUser = async (userId: string, phone: string) => {
    if (!confirm(`確定要刪除用戶 ${phone} 嗎？此操作無法撤銷。`)) return

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setUsers(users.filter(u => u.id !== userId))
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('刪除用戶失敗:', error)
      alert('刪除用戶失敗')
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
    <div className="space-y-4">
      {/* Add User Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-white/95">用戶列表</h2>
          <p className="text-sm text-neutral-600 dark:text-white/75">共 {users.length} 位用戶</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          添加用戶
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-white/95 mb-4">添加新用戶</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                電話號碼
              </label>
              <Input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="輸入 8 位數字（自動加 +852）或完整號碼"
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-white/65">例如: 66244432 或 +85266244432</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-white/85 mb-2">
                角色
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="EMPLOYEE">員工</option>
                <option value="MANAGER">經理</option>
                <option value="ADMIN">管理員</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={addUser} className="flex-1">
                添加
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false)
                  setNewPhone('')
                  setNewRole('EMPLOYEE')
                }}
                variant="secondary"
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* User List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Nickname or Phone Display */}
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="h-4 w-4 text-neutral-500 dark:text-white/65" />
                  {editingNickname === user.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={nicknameValue}
                        onChange={(e) => setNicknameValue(e.target.value)}
                        placeholder="輸入暱稱（選填）"
                        className="max-w-xs"
                        maxLength={50}
                        autoFocus
                      />
                      <button
                        onClick={() => updateNickname(user.id, nicknameValue)}
                        className="p-1 text-success-600 hover:bg-success-50 rounded"
                        title="保存"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingNickname(null)
                          setNicknameValue('')
                        }}
                        className="p-1 text-neutral-600 dark:text-white/75 hover:bg-neutral-50 rounded"
                        title="取消"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        {user.nickname ? (
                          <>
                            <span className="font-medium text-neutral-800 dark:text-white/95">{user.nickname}</span>
                            <span className="text-sm text-neutral-500 dark:text-white/65">{user.phoneE164}</span>
                          </>
                        ) : (
                          <span className="font-medium text-neutral-800 dark:text-white/95">{user.phoneE164}</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingNickname(user.id)
                          setNicknameValue(user.nickname || '')
                        }}
                        className="p-1 text-neutral-400 dark:text-white/55 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="編輯暱稱"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  {editingUser === user.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value as any)}
                        className="px-2 py-1 text-sm border border-neutral-300 rounded"
                      >
                        <option value="EMPLOYEE">員工</option>
                        <option value="MANAGER">經理</option>
                        <option value="ADMIN">管理員</option>
                      </select>
                      <button
                        onClick={() => updateRole(user.id, editingRole)}
                        className="p-1 text-success-600 hover:bg-success-50 rounded"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="p-1 text-neutral-600 dark:text-white/75 hover:bg-neutral-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${roleColors[user.role]}`}>
                      {roleNames[user.role]}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-white/75">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    加入: {new Date(user.createdAt).toLocaleDateString('zh-HK')}
                  </div>
                  <div>會話: {user._count.sessions}</div>
                  <div>設備: {user._count.devices}</div>
                  <div>操作: {user._count.auditLogs}</div>
                </div>
              </div>

              <div className="flex gap-2">
                {onSelectUser && (
                  <button
                    onClick={() => onSelectUser(user.id)}
                    className="p-2 text-info-600 hover:bg-info-50 rounded transition-colors"
                    title="查看此用戶的設備和日誌"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingUser(user.id)
                    setEditingRole(user.role)
                  }}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  title="修改角色"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteUser(user.id, user.phoneE164)}
                  className="p-2 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                  title="刪除用戶"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card className="p-12 text-center">
          <Shield className="h-12 w-12 text-neutral-300 dark:text-white/55 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-white/75">暫無用戶</p>
        </Card>
      )}
    </div>
  )
}

