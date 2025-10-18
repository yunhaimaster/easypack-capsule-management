'use client'

import { ReactNode } from 'react'

interface LiquidGlassHeroProps {
  title: string
  subtitle?: string
  description?: string
  icon?: ReactNode
  gradient?: 'blue' | 'purple' | 'emerald' | 'orange' | 'pink'
  actions?: ReactNode
  className?: string
}

const gradientVariants = {
  blue: 'from-primary-500 to-secondary-500',
  purple: 'from-info-500 to-pink-500',
  emerald: 'from-success-500 to-teal-500',
  orange: 'from-warning-500 to-danger-500',
  pink: 'from-pink-500 to-rose-500'
}

export function LiquidGlassHero({
  title,
  subtitle,
  description,
  icon,
  gradient = 'blue',
  actions,
  className = ''
}: LiquidGlassHeroProps) {
  return (
    <div className={`liquid-glass-card liquid-glass-card-brand liquid-glass-card-refraction ${className}`}>
      <div className="liquid-glass-content">
        <div className="px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Content */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {icon && (
                  <div className={`p-3 bg-gradient-to-br ${gradientVariants[gradient]} rounded-xl shadow-lg`}>
                    {icon}
                  </div>
                )}
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-[28px] font-semibold" style={{ color: '#2a588c' }}>
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm md:text-base text-neutral-600 max-w-2xl">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              {description && (
                <p className="text-neutral-600 text-base md:text-lg leading-relaxed max-w-2xl">
                  {description}
                </p>
              )}
            </div>

            {/* Right Actions */}
            {actions && (
              <div className="flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  {actions}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Predefined Hero variants for common use cases
export function OrdersHero({ orderCount }: { orderCount?: number }) {
  return (
    <LiquidGlassHero
      title="訂單管理"
      subtitle="生產記錄管理中心"
      description="查看、管理和分析所有膠囊生產訂單。追蹤生產進度，管理客戶訂單，並獲取詳細的生產報告。"
      icon={
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      }
      gradient="blue"
      actions={
        <>
          <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
            {orderCount ? `${orderCount} 個訂單` : '載入中...'}
          </span>
        </>
      }
    />
  )
}

export function NewOrderHero() {
  return (
    <LiquidGlassHero
      title="新建訂單"
      subtitle="建立新的膠囊生產訂單"
      description="輸入客戶資訊、產品規格和原料配方，建立新的膠囊生產訂單。系統將自動計算批次重量和生產需求。"
      icon={
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
        </svg>
      }
      gradient="purple"
    />
  )
}

export function OrderDetailHero({ order }: { order: any }) {
  return (
    <LiquidGlassHero
      title={`訂單 #${order?.id || 'N/A'}`}
      subtitle={order?.customerName || '客戶名稱'}
      description={`產品：${order?.productName || '未命名產品'} | 數量：${order?.productionQuantity || 0} 粒`}
      icon={
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      }
      gradient="emerald"
    />
  )
}

export function ReportsHero({ stats }: { stats?: any }) {
  return (
    <LiquidGlassHero
      title="生產報告"
      subtitle="數據分析與統計"
      description="查看生產統計數據、原料使用分析、風險評估報告和生產趨勢分析。"
      icon={
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
        </svg>
      }
      gradient="orange"
      actions={
        <>
          <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
            數據分析
          </span>
        </>
      }
    />
  )
}

export function LoginHero() {
  return (
    <LiquidGlassHero
      title="系統登陸"
      subtitle="Easy Health 膠囊配方管理系統"
      description="請輸入登陸碼以訪問系統。如有登陸問題，請聯繫系統管理員。"
      icon={
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
      }
      gradient="blue"
    />
  )
}
