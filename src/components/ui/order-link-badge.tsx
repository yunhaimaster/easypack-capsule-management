'use client'

import { Badge } from '@/components/ui/badge'
import { Link2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Route } from 'next'

interface OrderLinkBadgeProps {
  type: 'work-order' | 'encapsulation-order'
  orderId: string
  label: string
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function OrderLinkBadge({ 
  type, 
  orderId, 
  label, 
  size = 'sm',
  showIcon = true 
}: OrderLinkBadgeProps) {
  const href = (type === 'work-order' 
    ? `/work-orders/${orderId}` 
    : `/orders/${orderId}`) as Route
  
  const sizeClasses = size === 'md' ? 'text-sm px-3 py-1.5' : 'text-xs px-2 py-1'
  
  return (
    <Link href={href} className="inline-block">
      <Badge 
        variant="info" 
        className={`inline-flex items-center gap-1.5 hover:scale-105 transition-apple cursor-pointer ${sizeClasses}`}
      >
        {showIcon && <Link2 className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} />}
        <span className="truncate max-w-[150px] sm:max-w-[200px]">{label}</span>
        <ExternalLink className="h-2.5 w-2.5 opacity-70 flex-shrink-0" />
      </Badge>
    </Link>
  )
}

