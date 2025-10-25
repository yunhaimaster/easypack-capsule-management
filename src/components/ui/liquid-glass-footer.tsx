"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Route } from 'next'

import { useAuth } from '@/components/auth/auth-provider'
import { getFooterSections, type FooterSection } from '@/data/navigation'
import { Download } from 'lucide-react'

interface FooterLink {
  href: string
  label: string
  isExternal?: boolean
}

interface LiquidGlassFooterProps {
  className?: string
}

export function LiquidGlassFooter({ className = '' }: LiquidGlassFooterProps) {
  const { isAuthenticated } = useAuth()

  // Use centralized footer sections data
  const footerSections = getFooterSections()

  return (
    <footer className={`liquid-glass-footer ${className}`}>
      <div className="liquid-glass-footer-content">
        {/* 公司信息 */}
        <div className="liquid-glass-footer-brand">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 relative">
            <Image 
              src="/images/EasyHealth_Logo_only.svg" 
              alt="Easy Health Logo" 
              fill
              className="object-contain"
              priority
              quality={90}
              sizes="32px"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white/95">Easy Health</h3>
            <p className="text-sm text-neutral-600 dark:text-white/75">膠囊配方管理系統</p>
          </div>
        </div>
          <p className="text-sm text-neutral-600 dark:text-white/75 max-w-xs">
            專業的膠囊灌裝工廠代工管理系統，提供AI驅動的配方生成和生產管理解決方案。
          </p>
        </div>

        {/* 導航鏈接 */}
        <div className="liquid-glass-footer-links">
          {footerSections.map((section, index) => (
            <div key={index} className="liquid-glass-footer-section">
              <h4 className="liquid-glass-footer-title">{section.title}</h4>
              <ul className="liquid-glass-footer-list">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.isExternal ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="liquid-glass-footer-link liquid-glass-footer-resource-link"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {link.label}
                      </a>
                    ) : (
                      <Link 
                        href={link.href as Route}
                        className="liquid-glass-footer-link"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 版權信息 */}
      <div className="liquid-glass-footer-bottom">
        <div className="liquid-glass-footer-bottom-content">
          <p className="text-sm text-neutral-600 dark:text-white/75">
            © 2025 Easy Health. 保留所有權利。
          </p>
        </div>
      </div>
    </footer>
  )
}
