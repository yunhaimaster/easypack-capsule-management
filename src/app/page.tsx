import type { Metadata } from 'next'
import { HomePageClient } from '@/components/home/home-page-client'

export const metadata: Metadata = {
  title: 'Easy Health 工作單管理系統｜首頁',
  description: '統一工作單平台：管理生產、包裝、倉務等各類工作，支援膠囊訂單、配方庫與 AI 助手。',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Easy Health 工作單管理系統',
    description: '掌握營運脈動：工作單管理、膠囊生產與配方庫一站式平台。',
    url: '/',
  },
}

export default function HomePage() {
  return <HomePageClient />
}