import type { Metadata } from 'next'
import { OrdersPageClient } from '@/components/orders/orders-page-client'
import { LiquidGlassNav } from '@/components/ui/liquid-glass-nav'
import { LiquidGlassFooter } from '@/components/ui/liquid-glass-footer'

export const metadata: Metadata = {
  title: 'Easy Health 膠囊配方管理系統｜膠囊訂單列表',
  description: '查看並管理所有膠囊生產訂單，包含進行中、未開始與已完成狀態，支援即時篩選與匯出報表。',
  alternates: {
    canonical: '/orders',
  },
  openGraph: {
    title: '膠囊訂單管理',
    description: '掌握膠囊訂單狀態，支援即時篩選、匯出與 AI 分析。',
    url: '/orders',
  },
}

export default function OrdersPage() {
  return <OrdersPageClient />
}
