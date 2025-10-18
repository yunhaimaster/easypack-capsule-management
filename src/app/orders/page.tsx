import type { Metadata } from 'next'
import { Suspense } from 'react'
import { OrdersPageClient } from '@/components/orders/orders-page-client'
import { StreamingOrdersPage } from '@/components/orders/streaming-orders-list'
import { LoadingFallback } from '@/components/ui/streaming-layout'

export const metadata: Metadata = {
  title: '生產訂單管理｜Easy Health 膠囊管理系統',
  description: '查看並管理所有膠囊生產訂單，包含進行中、未開始與已完成狀態，支援即時篩選與匯出報表。',
  alternates: {
    canonical: '/orders',
  },
  openGraph: {
    title: '生產訂單管理',
    description: '掌握客戶訂單狀態，支援即時篩選、匯出與 AI 分析。',
    url: '/orders',
  },
}

export default function OrdersPage() {
  return (
    <StreamingOrdersPage>
      <Suspense fallback={<LoadingFallback message="Loading orders..." />}>
        <OrdersPageClient />
      </Suspense>
    </StreamingOrdersPage>
  )
}
