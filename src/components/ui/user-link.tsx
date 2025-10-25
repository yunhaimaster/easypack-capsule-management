/**
 * User Link Component
 * 
 * Displays a user's name/nickname as a clickable link
 * Can be used for:
 * - Person in charge (負責人)
 * - Customer service (客服)
 * - Any user reference
 * 
 * Supports multiple display modes:
 * - badge: Small pill-style badge
 * - inline: Inline text link
 * - card: Card-style display with avatar
 */

'use client'

import Link from 'next/link'
import { Text } from '@/components/ui/text'
import { User } from 'lucide-react'

interface UserLinkProps {
  userId: string
  nickname?: string | null
  phoneE164?: string
  mode?: 'badge' | 'inline' | 'card'
  label?: string  // Optional prefix label (e.g., "客服：")
  className?: string
}

export function UserLink({ 
  userId, 
  nickname, 
  phoneE164, 
  mode = 'inline',
  label,
  className = ''
}: UserLinkProps) {
  const displayName = nickname || phoneE164 || '未知用戶'

  if (mode === 'badge') {
    return (
      <Link
        href={`/admin/users?highlight=${userId}` as any}
        className={`inline-flex items-center gap-1 text-xs bg-neutral-100 dark:bg-elevation-2 hover:bg-neutral-200 dark:hover:bg-elevation-3 text-neutral-600 dark:text-white/75 hover:text-neutral-800 dark:hover:text-white/90 px-2 py-0.5 rounded-full transition-all ${className}`}
        title={`查看 ${displayName} 的資料`}
      >
        {label && <span className="opacity-75">{label}</span>}
        <User className="h-3 w-3" />
        <span>{displayName}</span>
      </Link>
    )
  }

  if (mode === 'card') {
    return (
      <Link
        href={`/admin/users?highlight=${userId}` as any}
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-surface-secondary/50 dark:hover:bg-elevation-1 transition-all group ${className}`}
        title={`查看 ${displayName} 的資料`}
      >
        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          {label && (
            <Text.Tertiary className="text-xs">
              {label}
            </Text.Tertiary>
          )}
          <Text.Primary className="text-sm font-medium truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {displayName}
          </Text.Primary>
        </div>
      </Link>
    )
  }

  // mode === 'inline'
  return (
    <Link
      href={`/admin/users?highlight=${userId}` as any}
      className={`inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline transition-colors ${className}`}
      title={`查看 ${displayName} 的資料`}
    >
      {label && <span className="text-neutral-600 dark:text-white/75">{label}</span>}
      <User className="h-3 w-3" />
      <span>{displayName}</span>
    </Link>
  )
}

