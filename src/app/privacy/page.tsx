import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Shield, Lock, FileText, Eye, Database, Globe } from 'lucide-react'

const sections = [
  {
    icon: Shield,
    title: '隱私承諾',
    description: '我們重視您的隱私，只在必要時收集並使用資料。所有數據皆以最高安全標準處理。'
  },
  {
    icon: FileText,
    title: '資料使用範圍',
    description: '資料僅用於系統操作、訂單管理與服務品質提升，不會向未經授權的第三方披露。'
  },
  {
    icon: Lock,
    title: '資料保護',
    description: '採用多層加密與存取控制，防止未經授權的資料存取或外洩。'
  },
  {
    icon: Eye,
    title: '使用者控制',
    description: '您可隨時查詢、更正或刪除個人資料。我們提供透明、明確的資料管理流程。'
  },
  {
    icon: Database,
    title: '資料保存期間',
    description: '資料僅保留於業務必要期間，達成目的後即安全刪除或匿名化處理。'
  },
  {
    icon: Globe,
    title: '國際傳輸',
    description: '若涉及跨境資料傳輸，我們將確保符合相關隱私法規與安全要求。'
  }
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen logo-bg-animation flex flex-col">
      <LiquidGlassNav />
      <main className="flex-1 pt-28 sm:pt-24 px-4 sm:px-6 md:px-12 lg:px-20 space-y-10 floating-combined pb-16">
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/15 border border-primary-300/40 text-xs text-primary-700">
            <Shield className="h-4 w-4" />
            Easy Health 隱私政策
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-800">保護您的資料，是我們的首要任務</h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            我們以最高標準保護您的個人與業務資料，並確保所有資料收集、使用與保存流程完全透明，符合香港相關法規及業界最佳實務。
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.title} className="liquid-glass-card liquid-glass-card-elevated">
              <CardHeader className="flex items-center gap-3">
                <div className="icon-container icon-container-blue">
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
              <CardTitle className="text-lg text-neutral-800">資料請求與聯絡方式</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600">
              <p>如需查詢、更新或刪除資料，請聯絡 Easy Health 資料保護負責人：</p>
              <ul className="space-y-2">
                <li>📧 電郵：privacy@easyhealth.hk</li>
                <li>📞 電話：+852 1234 5678</li>
                <li>🏢 地址：香港九龍灣啟德數碼港 88 號</li>
              </ul>
              <p className="text-xs text-neutral-500">我們會於 7 個工作天內回覆您的請求，並提供適當協助。</p>
            </CardContent>
          </Card>

          <Card className="liquid-glass-card liquid-glass-card-elevated">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-800">政策更新</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600">
              <p>隱私政策將因應法律與服務需求定期更新。所有更新會即時於本頁公布，並顯示最新生效日期。</p>
              <div className="rounded-xl bg-primary-500/10 border border-primary-300/40 p-3 text-primary-700 text-sm">
                最新更新日期：2025年10月1日
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <LiquidGlassFooter className="w-full" />
    </div>
  )
}
