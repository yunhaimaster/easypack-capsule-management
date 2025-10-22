import { AdminPageClient } from '@/components/admin/admin-page-client'

export const metadata = {
  title: '系統管理 | Easy Health',
  description: '用戶管理、設備監控、審計日誌',
}

export default function AdminPage() {
  return <AdminPageClient />
}

