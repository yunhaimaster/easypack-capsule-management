import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center brand-logo-pattern-bg px-4">
      <div className="w-full max-w-md">
        <Card className="liquid-glass-card liquid-glass-card-elevated shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary-500/10 rounded-full w-fit">
              <Logo size="lg" variant="icon" />
            </div>
            <CardTitle className="text-6xl font-bold text-neutral-900 mb-2">
              404
            </CardTitle>
            <CardDescription className="text-lg text-neutral-600">
              頁面未找到
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-neutral-600">
              抱歉，您訪問的頁面不存在或已被移動。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="flex items-center gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  返回首頁
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex items-center gap-2">
                <Link href="/orders">
                  <Search className="h-4 w-4" />
                  查看訂單
                </Link>
              </Button>
            </div>
            <div className="pt-4 border-t border-neutral-200">
              <p className="text-sm text-neutral-500">
                如有問題，請聯繫系統管理員
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
