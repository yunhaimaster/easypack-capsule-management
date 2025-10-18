'use client'

import React, { Suspense, useOptimistic, useTransition, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconContainer } from '@/components/ui/icon-container'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'
import { StreamingBoundary, LoadingFallback, StreamingSkeleton } from '@/components/ui/streaming-layout'
import { OptimisticForm } from '@/components/ui/optimistic-form'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ProductionOrder {
  id: string
  customerName: string
  productName: string
  productionQuantity: number
  completionDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

interface OptimisticOrder {
  id: string
  customerName: string
  productName: string
  productionQuantity: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  isOptimistic?: boolean
}

interface StreamingOrdersListProps {
  orders: ProductionOrder[]
  onCreateOrder: (formData: FormData) => Promise<void>
  onUpdateOrder: (id: string, formData: FormData) => Promise<void>
  onDeleteOrder: (id: string) => Promise<void>
  className?: string
}

export function StreamingOrdersList({
  orders,
  onCreateOrder,
  onUpdateOrder,
  onDeleteOrder,
  className
}: StreamingOrdersListProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticOrders, addOptimisticOrder] = useOptimistic(
    orders,
    (state, newOrder: OptimisticOrder) => [newOrder, ...state]
  )

  const handleCreateOrder = async (formData: FormData) => {
    const customerName = formData.get('customerName') as string
    const productName = formData.get('productName') as string
    const productionQuantity = Number(formData.get('productionQuantity'))

    // Create optimistic order
    const optimisticOrder: OptimisticOrder = {
      id: `temp-${Date.now()}`,
      customerName,
      productName,
      productionQuantity,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true
    }

    addOptimisticOrder(optimisticOrder)

    startTransition(async () => {
      try {
        await onCreateOrder(formData)
      } catch (error) {
        console.error('Failed to create order:', error)
      }
    })
  }

  const handleDeleteOrder = async (id: string) => {
    startTransition(async () => {
      try {
        await onDeleteOrder(id)
      } catch (error) {
        console.error('Failed to delete order:', error)
      }
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Create Order Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconContainer icon={Plus} variant="success" size="sm" />
            Create New Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OptimisticForm
            onSubmit={handleCreateOrder}
            placeholder="Enter order details..."
            className="max-w-2xl"
          />
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconContainer icon={Eye} variant="primary" size="sm" />
            Production Orders
            {isPending && (
              <IconContainer icon={Loader2} variant="info" size="sm" className="animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StreamingBoundary
            fallback={<StreamingSkeleton lines={5} />}
            errorFallback={({ error, resetError }) => (
              <div className="text-center p-8">
                <IconContainer icon={AlertCircle} variant="danger" size="lg" className="mb-4" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Failed to Load Orders
                </h3>
                <p className="text-neutral-600 mb-4">{error.message}</p>
                <Button onClick={resetError} variant="outline">
                  Try Again
                </Button>
              </div>
            )}
          >
            <div className="space-y-4">
              {optimisticOrders.map((order) => (
                <StreamingOrderItem
                  key={order.id}
                  order={order}
                  onUpdate={onUpdateOrder}
                  onDelete={handleDeleteOrder}
                  isPending={isPending}
                />
              ))}
            </div>
          </StreamingBoundary>
        </CardContent>
      </Card>
    </div>
  )
}

interface StreamingOrderItemProps {
  order: OptimisticOrder
  onUpdate: (id: string, formData: FormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isPending: boolean
}

function StreamingOrderItem({ order, onUpdate, onDelete, isPending }: StreamingOrderItemProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'in_progress':
        return Clock
      case 'cancelled':
        return AlertCircle
      default:
        return Clock
    }
  }

      const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
        switch (status) {
          case 'completed':
            return 'default'
          case 'in_progress':
            return 'secondary'
          case 'cancelled':
            return 'destructive'
          default:
            return 'outline'
        }
      }

      const getStatusIconVariant = (status: string): "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral" => {
        switch (status) {
          case 'completed':
            return 'success'
          case 'in_progress':
            return 'primary'
          case 'cancelled':
            return 'danger'
          default:
            return 'neutral'
        }
      }

  return (
    <Card className={cn(
      "transition-all duration-200",
      order.isOptimistic && "opacity-75 border-blue-200 bg-blue-50",
      isPending && "opacity-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-neutral-800">
                {order.customerName}
              </h3>
              <Badge variant={getStatusVariant(order.status)}>
                <IconContainer 
                  icon={getStatusIcon(order.status)} 
                  variant={getStatusIconVariant(order.status)}
                  size="sm"
                  className="mr-1"
                />
                {order.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {order.isOptimistic && (
                <Badge variant="secondary">
                  <IconContainer icon={Loader2} variant="info" size="sm" className="mr-1 animate-spin" />
                  Creating...
                </Badge>
              )}
            </div>
            <p className="text-sm text-neutral-600 mb-1">
              Product: {order.productName}
            </p>
            <p className="text-sm text-neutral-600">
              Quantity: {order.productionQuantity.toLocaleString()} units
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              Created: {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link href={`/orders/${order.id}`}>
                <IconContainer icon={Eye} variant="primary" size="sm" />
                View
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link href={`/orders/${order.id}/edit`}>
                <IconContainer icon={Edit} variant="warning" size="sm" />
                Edit
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(order.id)}
              disabled={isPending || order.isOptimistic}
              className="text-red-600 hover:text-red-700"
            >
              <IconContainer icon={Trash2} variant="danger" size="sm" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Streaming wrapper for the entire orders page
interface StreamingOrdersPageProps {
  children: ReactNode
  className?: string
}

export function StreamingOrdersPage({ children, className }: StreamingOrdersPageProps) {
  return (
    <div className={cn("container mx-auto p-6", className)}>
      <StreamingBoundary
        fallback={
          <div className="space-y-6">
            <LoadingFallback message="Loading orders page..." />
            <StreamingSkeleton lines={8} />
          </div>
        }
      >
        {children}
      </StreamingBoundary>
    </div>
  )
}
