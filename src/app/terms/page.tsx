'use client'

import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Scale, FileSignature, Users, ShieldCheck, Zap, Clock } from 'lucide-react'

const sections = [
  {
    icon: Scale,
    title: '服務使用條款',
    description: '您使用 Easy Health 系統即表示同意遵守所有服務條款，包括資料使用限制與保密要求。'
  },
  {
    icon: Users,
    title: '授權帳戶管理',
    description: '帳戶僅供授權人員使用，不得轉讓或共享登入資訊，違者需承擔相關責任。'
  },
  {
    icon: FileSignature,
    title: '業務資料責任',
    description: '所有上傳或輸入之訂單、配方及客戶資料需由使用者確保準確性，Easy Health 不承擔法定責任。'
  },
  {
    icon: ShieldCheck,
    title: '系統安全',
    description: '使用者需配合我們的安全政策，不得嘗試入侵、逆向工程或破壞系統運作。'
  },
  {
    icon: Zap,
    title: '服務可用性',
    description: '我們致力提供穩定服務，但可能因維護或不可抗力而暫停，屆時將盡快通知並恢復。'
  },
  {
    icon: Clock,
    title: '條款更新',
    description: '我們保留隨時更新條款之權利。更新後將於本頁公布，並即時生效。'
  }
]

export default function TermsPage() {
  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      <main className="flex-1 pt-28 sm:pt-24 px-4 sm:px-6 md:px-12 lg:px-20 space-y-10 floating-combined pb-16">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/15 border border-purple-300/40 text-xs text-purple-700">
            <FileSignature className="h-4 w-4" />
            Easy Health 服務條款
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-800">專業、透明的合作協議</h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            以下條款旨在確保 Easy Health 與所有使用者皆能於安全、專業與透明的框架下運作。如有任何疑問，歡迎與我們聯絡，我們會提供進一步協助。
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.title} className="liquid-glass-card liquid-glass-card-elevated">
              <CardHeader className="flex items-center gap-3">
                <div className="icon-container icon-container-purple">
                  <section.icon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base text-neutral-800">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 leading-relaxed">{section.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="liquid-glass-card liquid-glass-card-elevated">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-800">使用者責任</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600">
              <ul className="space-y-2">
                <li>• 僅於授權範圍內使用系統，不得從事非法或侵權行為。</li>
                <li>• 應保障帳戶安全，如發現異常活動需即時通知 Easy Health。</li>
                <li>• 對於由使用者上傳或提供之資料負全部責任。</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="liquid-glass-card liquid-glass-card-elevated">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-800">聯絡與協助</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600">
              <p>若您對條款內容有任何疑問，請聯絡 Easy Health 法務團隊：</p>
              <ul className="space-y-2">
                <li>📧 電郵：legal@easyhealth.hk</li>
                <li>📞 電話：+852 1234 5678</li>
                <li>🏢 地址：香港九龍灣啟德數碼港 88 號</li>
              </ul>
              <p className="text-xs text-neutral-500">我們將於 5 個工作天內回覆，並提供協助。</p>
            </CardContent>
          </Card>
        </section>
      </main>
      <LiquidGlassFooter className="w-full" />
    </div>
  )
}
