import type { Metadata } from 'next'
import { HomePageClient } from '@/components/home/home-page-client'

export const metadata: Metadata = {
  title: 'Easy Health 膠囊配方管理系統｜首頁',
  description: '快速掌握最近生產與工時紀錄、最新公告與功能更新，支援 AI 助手與資料匯出。',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Easy Health 膠囊配方管理系統',
    description: '掌握營運脈動：最近生產紀錄、工時紀錄與功能更新。',
    url: '/',
  },
}

export default function HomePage() {
  return <HomePageClient />
}