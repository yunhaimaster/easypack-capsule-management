'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  Edit,
  Link2,
  Unlink,
  Trash2,
  MoreVertical,
  Loader2,
  Download,
} from 'lucide-react'
import { ProductionOrder } from '@/types'
import { useToast } from '@/components/ui/toast-provider'
import { LiquidGlassConfirmModal } from '@/components/ui/liquid-glass-modal'

interface OrderActionsMenuProps {
  order: ProductionOrder
  onDelete: (id: string) => void
  onLinkComplete: () => void
}

export function OrderActionsMenu({
  order,
  onDelete,
  onLinkComplete
}: OrderActionsMenuProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)

  const handleUnlink = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/link`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        showToast({ title: '已取消關聯' })
        onLinkComplete()
      } else {
        showToast({ title: result.error || '取消關聯失敗', variant: 'destructive' })
      }
    } catch (error) {
      showToast({ title: '取消關聯失敗', variant: 'destructive' })
    } finally {
      setIsLoading(false)
      setShowUnlinkConfirm(false)
    }
  }

  const handleExportIngredients = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/export-ingredients`)
      
      if (!response.ok) {
        const error = await response.json()
        showToast({ title: error.error || '導出失敗', variant: 'destructive' })
        return
      }

      // Get filename from Content-Disposition header
      // Header format: attachment; filename="encoded"; filename*=UTF-8''encoded
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${order.customerName}_${order.productName}_原料明細.xlsx`
      
      if (contentDisposition) {
        // Try to extract from filename*=UTF-8'' (RFC 5987, preferred for UTF-8)
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/)
        if (utf8Match && utf8Match[1]) {
          filename = decodeURIComponent(utf8Match[1])
        } else {
          // Fall back to filename="..." (extract quoted value)
          const quotedMatch = contentDisposition.match(/filename="([^"]+)"/)
          if (quotedMatch && quotedMatch[1]) {
            filename = decodeURIComponent(quotedMatch[1])
          }
        }
      }

      // Convert response to blob and download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast({ title: '導出成功' })
    } catch (error) {
      showToast({ title: '導出失敗，請稍後重試', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MoreVertical className="h-5 w-5" />
          )}
          <span className="sr-only">操作選單</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* View/Edit */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/orders/${order.id}`)
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            <span>查看詳情</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/orders/${order.id}/edit`)
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>編輯</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async (e) => {
              e.stopPropagation()
              await handleExportIngredients()
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            <span>導出原料明細</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Relations - Context-aware */}
          {order.workOrder ? (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/work-orders/${order.workOrder!.id}`)
                }}
              >
                <Eye className="mr-2 h-4 w-4 text-info-600" />
                <span>查看已關聯工作單</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setShowUnlinkConfirm(true)
                }}
                className="text-warning-600"
              >
                <Unlink className="mr-2 h-4 w-4" />
                <span>取消關聯</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/orders/${order.id}#link`)
              }}
            >
              <Link2 className="mr-2 h-4 w-4 text-info-600" />
              <span>關聯工作單</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onDelete(order.id)
            }}
            className="text-danger-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>刪除</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Unlink Confirmation Modal */}
      <LiquidGlassConfirmModal
        isOpen={showUnlinkConfirm}
        onClose={() => setShowUnlinkConfirm(false)}
        onConfirm={handleUnlink}
        title="確認取消關聯"
        message={`確定要取消與工作單「${order.workOrder?.jobNumber || order.workOrder?.customerName}」的關聯嗎？`}
        confirmText="取消關聯"
        variant="danger"
      />
    </>
  )
}

