import { LoginForm } from '@/components/auth/login-form'
import { Badge } from '@/components/ui/badge'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <div className="min-h-screen brand-logo-bg-animation relative overflow-hidden" suppressHydrationWarning>
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-white/70 via-white/40 to-transparent pointer-events-none" aria-hidden="true" />
      <main className="relative min-h-screen flex items-center justify-center px-6 md:px-10 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center">
          <section className="space-y-6 text-center md:text-left">
            <Badge variant="outline" className="inline-flex items-center gap-2 text-xs shadow-sm">
              <span className="font-medium tracking-wide">品牌登入</span>
              <span className="text-[11px] text-neutral-500">Easy Health Capsule Management</span>
            </Badge>
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-2xl font-semibold tracking-tight text-[--brand-neutral]">
                登入膠囊配方管理系統
              </h1>
              <p className="text-sm sm:text-sm text-neutral-600 leading-relaxed max-w-md md:pr-10">
                使用一次性驗證碼存取控制台。
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs text-neutral-500">
              <Badge variant="outline" className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
                SSL 加密登入
              </Badge>
              <Badge variant="outline" className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                內部授權使用
              </Badge>
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
