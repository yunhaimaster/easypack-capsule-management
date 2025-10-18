import type { Metadata } from 'next'
import { WorklogsPageClient } from '@/components/worklogs/worklogs-page-client'

export const metadata: Metadata = {
  title: '工時紀錄管理｜Easy Health 膠囊管理系統',
  description: '查看每日工時紀錄與累積工時，支援依訂單、員工與日期區間篩選，提供 CSV 匯出功能。',
  alternates: {
    canonical: '/worklogs',
  },
  openGraph: {
    title: '工時紀錄管理',
    description: '掌握員工與訂單工時利用率，並匯出詳細報表。',
    url: '/worklogs',
  },
}

export default function WorklogsPage() {
  return <WorklogsPageClient />
}

