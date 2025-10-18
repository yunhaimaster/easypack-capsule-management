'use client'

import { ReactNode } from 'react'

interface LiquidGlassHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

export function LiquidGlassHeader({
  title,
  subtitle,
  children,
  actions,
  className = ''
}: LiquidGlassHeaderProps) {
  return (
    <header className={`liquid-glass-header ${className}`}>
      <div className="liquid-glass-header-content">
        {/* Title Section */}
        <div>
          <h1 className="liquid-glass-header-title">{title}</h1>
          {subtitle && (
            <p className="liquid-glass-header-subtitle">{subtitle}</p>
          )}
        </div>

        {/* Content Section */}
        {children && (
          <div className="flex items-center justify-center">
            {children}
          </div>
        )}

        {/* Actions Section */}
        {actions && (
          <div className="liquid-glass-header-actions">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

// Preset header variants
export function LiquidGlassPageHeader({
  title,
  subtitle,
  actions,
  className = ''
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <LiquidGlassHeader
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
    />
  )
}

export function LiquidGlassSectionHeader({
  title,
  subtitle,
  actions,
  className = ''
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <LiquidGlassHeader
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={`mb-6 ${className}`}
    />
  )
}
