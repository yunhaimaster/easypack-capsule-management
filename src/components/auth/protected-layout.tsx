'use client'

import { LoginForm } from './login-form'
import { usePathname } from 'next/navigation'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()

  if (pathname === '/login') {
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
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[--brand-neutral]">
                  登入膠囊配方管理系統
                </h1>
                <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed max-w-md md:pr-10">
                  使用一次性驗證碼存取控制台。
                </p>
              </div>
            </section>

            <section>
              <LoginForm />
            </section>
          </div>
        </main>
      </div>
    )
  }

  return <>{children}</>
}
