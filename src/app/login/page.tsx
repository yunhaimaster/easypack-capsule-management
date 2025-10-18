'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLogout, setIsLogout] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  useEffect(() => {
    // 檢查是否是登出操作
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('logout') === 'true') {
      // 清除所有認證狀態
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('easypack_auth')
      setIsLogout(true)
      setIsAuthenticated(false)
      return
    }

    // Check if user is already authenticated
    const authStatus = localStorage.getItem('isAuthenticated')
    const easypackAuth = localStorage.getItem('easypack_auth')
    if (authStatus === 'true' || easypackAuth === 'true') {
      setIsAuthenticated(true)
      router.push('/')
    }
  }, [router])

  const handleLogin = (role: 'admin' | 'user') => {
    login(role)
    setIsAuthenticated(true)
    router.push('/')
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen brand-logo-bg-animation relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-white/70 via-white/40 to-transparent pointer-events-none" aria-hidden="true" />
      <main className="relative min-h-screen flex items-center justify-center px-6 md:px-10 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center">
          <section className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/70 text-xs text-[--brand-neutral] shadow-sm">
              <span className="font-medium tracking-wide">品牌登入</span>
              <span className="text-[11px] text-neutral-500">Easy Health Capsule Management</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-2xl font-semibold tracking-tight text-[--brand-neutral]">
                登入膠囊配方管理系統
              </h1>
              <p className="text-sm sm:text-sm text-neutral-600 leading-relaxed max-w-md md:pr-10">
                使用授權登入碼存取專屬控制台，集中管理配方、訂單與資料庫。請保持登入資訊安全並遵守操作指南。
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/40 border border-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
                SSL 加密登入
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/40 border border-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                內部授權使用
              </span>
            </div>
          </section>

          <section>
            <LoginForm onLogin={handleLogin} />
          </section>
        </div>
      </main>
    </div>
  )
}
