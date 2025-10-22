'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Phone, Shield } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export function LoginForm() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [trust, setTrust] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Silent login removed - middleware already handles redirects for authenticated users

  const startOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/otp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStep('otp')
      } else {
        setError(data.error || '發送驗證碼失敗')
      }
    } catch {
      setError('發送時發生錯誤')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      console.log('[Login] Verifying OTP with phone:', phone)
      
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, trustDevice: trust }),
      })
      
      console.log('[Login] Response status:', res.status)
      console.log('[Login] Response headers:', Object.fromEntries(res.headers.entries()))
      
      const data = await res.json()
      console.log('[Login] Response data:', data)
      
      if (res.ok && data.success) {
        console.log('[Login] Verification successful, redirecting...')
        // Cookie is now set, wait a moment then do full page navigation
        await new Promise(resolve => setTimeout(resolve, 100))
        window.location.href = '/'
        return
      }
      
      console.error('[Login] Verification failed:', data.error)
      setError(data.error || '驗證失敗')
      setIsLoading(false)
    } catch (err) {
      console.error('[Login] Exception during verification:', err)
      setError('驗證時發生錯誤')
      setIsLoading(false)
    }
  }

  return (
    <Card className="liquid-glass-card liquid-glass-card-elevated login-liquid-card w-full max-w-md mx-auto shadow-xl">
      <CardContent className="pt-10 pb-8 px-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto mb-2 login-liquid-emblem">
            <Logo size="lg" variant="icon" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-primary-600">Easy Health 系統登入</h2>
          <p className="text-sm text-neutral-600">請輸入您在 EPL 通訊 WhatsApp 群組使用的電話號碼</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={startOtp} className="space-y-4">
            <div className="space-y-2 text-left">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                電話號碼（EPL 通訊群組）
              </label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="輸入 WhatsApp 群組的號碼（8位數字）"
                  className="pl-9"
                  autoFocus
                  required
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="ripple-effect btn-micro-hover micro-brand-glow w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? '發送中...' : '發送驗證碼'}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="space-y-2 text-left">
              <label htmlFor="code" className="text-sm font-medium text-gray-700">
                驗證碼
              </label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6 位數字"
                  autoFocus
                  required
                />
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} />
              <span className="inline-flex items-center gap-1">信任此裝置 30 天 <Shield className="h-3.5 w-3.5 text-neutral-500" /></span>
            </label>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="ripple-effect btn-micro-hover micro-brand-glow w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? '登入中...' : '登入'}
            </Button>
          </form>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">如有登入問題，請聯繫 Victor</p>
        </div>
      </CardContent>
    </Card>
  )
}
