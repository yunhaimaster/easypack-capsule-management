'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { IconContainer } from '@/components/ui/icon-container'
import { getMainNavigationLinks, type NavigationLink } from '@/data/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { 
  Menu, 
  X, 
  ChevronRight, 
  Home, 
  ClipboardList, 
  Calendar, 
  Package, 
  Clock, 
  Library, 
  Sparkles, 
  FlaskConical, 
  Palette, 
  Settings,
  LogOut,
  Battery
} from 'lucide-react'
import { Route } from 'next'
import { ThemeToggle } from '@/components/theme/theme-toggle'

type NavLink = NavigationLink & {
  active?: boolean
}

// Enhanced icon mapping for mobile navigation
const iconMap = {
  Home,
  ClipboardList,
  Calendar,
  Package,
  Clock,
  Library,
  Sparkles,
  FlaskConical,
  Palette,
  Settings,
  LogOut
}

interface EnhancedMobileNavProps {
  logo?: React.ReactNode
  links?: NavLink[]
  className?: string
}

// Navigation item component with proper touch targets and accessibility
function NavigationItem({ 
  item, 
  isActive, 
  onClick, 
  level = 0 
}: { 
  item: NavLink
  isActive: boolean
  onClick: () => void
  level?: number
}) {
  const IconComponent = item.icon ? iconMap[item.icon as keyof typeof iconMap] : null
  const hasChildren = item.children && item.children.length > 0
  
  return (
    <button
      className={`
        w-full flex items-center px-4 py-3 rounded-xl
        min-h-[44px] text-left
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary-500/20
        ${isActive ? 
          'bg-primary-500/10 border-l-4 border-primary-500 text-primary-600' : 
          'text-neutral-700 hover:bg-neutral-100/50 dark:text-neutral-300 dark:hover:bg-neutral-800/50'
        }
        ${level > 0 ? 'ml-4' : ''}
      `}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.label}
    >
      {IconComponent && (
        <IconContainer 
          icon={IconComponent} 
          variant={isActive ? 'primary' : 'neutral'} 
          size="sm" 
          className="flex-shrink-0"
        />
      )}
      <span className="ml-3 font-medium flex-1">{item.label}</span>
      {hasChildren && (
        <ChevronRight className="ml-auto h-4 w-4 text-neutral-400" />
      )}
      {isActive && (
        <div className="ml-2 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
      )}
    </button>
  )
}

// Section header component
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-6 py-3">
      <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        {title}
      </h3>
    </div>
  )
}

export function EnhancedMobileNav({
  logo = <Logo />,
  links,
  className = ''
}: EnhancedMobileNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const { logout, isAdmin, isManager } = useAuth()
  
  // Get navigation links based on user role
  const navigationLinks = links || getMainNavigationLinks({ isAdmin, isManager })

  // Auto-detect active link based on current pathname
  const processedLinks = navigationLinks.map(link => ({
    ...link,
    active: pathname === link.href || 
            (link.href !== '/' && pathname.startsWith(link.href)) ||
            (link.href === '/' && pathname === '/')
  }))

  // Intersection Observer for scroll-based transparency
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Handle navigation item click
  const handleNavItemClick = (link: NavLink) => {
    if (link.label === '登出') {
      logout()
      closeMobileMenu()
      setTimeout(() => window.location.assign('/login?logout=true'), 50)
    } else {
      closeMobileMenu()
    }
  }

  // Group navigation items by sections
  const workOrderSection = processedLinks.filter(link => 
    link.href === '/' || 
    link.href === '/work-orders' || 
    link.href === '/worklogs' ||
    (link.children && link.children.some(child => 
      child.href === '/work-orders' || 
      child.href === '/manager-scheduling' || 
      child.href === '/orders'
    ))
  )

  const toolsSection = processedLinks.filter(link => 
    link.href === '/ai-recipe-generator' && link.children
  )

  const adminSection = processedLinks.filter(link => 
    link.href === '/admin'
  )

  const logoutSection = processedLinks.filter(link => 
    link.label === '登出'
  )

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-white/90 focus:text-neutral-900 dark:text-white/95 focus:shadow-lg transition" aria-label="跳至主要內容">
        跳至主要內容
      </a>
      <nav
        ref={navRef}
        className={`liquid-glass-nav ${isScrolled ? 'scrolled' : ''} ${className}`}
        role="navigation"
        aria-label="主要導航"
      >
        <div className="liquid-glass-nav-content">
          {/* Logo and Brand Section - Left side */}
          <div className="liquid-glass-nav-brand flex items-center space-x-1 sm:space-x-2">
            <Link 
              href="/" 
              className="liquid-glass-nav-logo focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
              aria-label="回到首頁"
            >
              {logo}
            </Link>
            <div className="flex flex-col leading-tight min-w-0">
              <h1 className="text-[11px] sm:text-sm md:text-base lg:text-lg font-bold text-neutral-900 dark:text-white/95">
                Easy Health
              </h1>
              <p className="hidden sm:block text-xs md:text-sm text-neutral-600 dark:text-white/75">
                生產管理系統
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links - Right side */}
          <div className="liquid-glass-nav-links">
            {processedLinks.map((link) => (
              link.children ? (
                <div key={link.href} className="relative group">
                  <button className="liquid-glass-nav-link flex items-center">
                    {link.label}
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:rotate-90" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {link.children.map((child) => {
                      const IconComponent = child.icon ? iconMap[child.icon as keyof typeof iconMap] : null
                      return (
                        <Link
                          key={child.href}
                          href={child.href as Route}
                          className="flex items-center px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 first:rounded-t-xl last:rounded-b-xl"
                        >
                          {IconComponent && (
                            <IconComponent className="h-4 w-4 mr-3 text-neutral-500" />
                          )}
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href as Route}
                  className={`liquid-glass-nav-link ${link.active ? 'active' : ''}`}
                  onClick={(event) => {
                    if (link.label === '登出') {
                      event.preventDefault()
                      logout()
                      setTimeout(() => window.location.assign('/login?logout=true'), 50)
                    }
                  }}
                  aria-current={link.active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              )
            ))}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="liquid-glass-nav-mobile-toggle"
            onClick={handleMobileMenuToggle}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? '關閉選單' : '開啟選單'}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </svg>
          </button>
        </div>

        {/* Enhanced Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001]"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            
            {/* Drawer */}
            <div className="
              fixed inset-y-0 left-0 z-[10002] w-80 max-w-sm
              bg-white/98 dark:bg-neutral-900/98 backdrop-blur-2xl
              border-r border-neutral-200/30 dark:border-neutral-700/50
              shadow-2xl shadow-black/20
              transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
              translate-x-0
            ">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200/20 dark:border-neutral-700/30">
                <div className="flex items-center space-x-3">
                  <IconContainer icon={Battery} variant="primary" size="sm" />
                  <span className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">Easy Health</span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                  aria-label="關閉選單"
                >
                  <X className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Navigation Content */}
              <div className="flex-1 overflow-y-auto py-6">
                {/* Work Order Management Section */}
                <div className="mb-6">
                  <SectionHeader title="工作管理" />
                  <div className="px-3 space-y-1">
                    {workOrderSection.map((link) => (
                      <div key={link.href}>
                        {link.children ? (
                          <div className="space-y-1">
                            {link.children.map((child) => {
                              const childActive = pathname === child.href || 
                                (child.href !== '/' && pathname.startsWith(child.href))
                              return (
                                <NavigationItem
                                  key={child.href}
                                  item={child}
                                  isActive={childActive}
                                  onClick={() => handleNavItemClick(child)}
                                  level={1}
                                />
                              )
                            })}
                          </div>
                        ) : (
                          <NavigationItem
                            item={link}
                            isActive={link.active || false}
                            onClick={() => handleNavItemClick(link)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools Section */}
                {toolsSection.length > 0 && (
                  <div className="mb-6">
                    <SectionHeader title="工具" />
                    <div className="px-3 space-y-1">
                      {toolsSection.map((link) => (
                        <div key={link.href}>
                          {link.children && (
                            <div className="space-y-1">
                              {link.children.map((child) => {
                                const childActive = pathname === child.href || 
                                  (child.href !== '/' && pathname.startsWith(child.href))
                                return (
                                  <NavigationItem
                                    key={child.href}
                                    item={child}
                                    isActive={childActive}
                                    onClick={() => handleNavItemClick(child)}
                                    level={1}
                                  />
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Section */}
                {adminSection.length > 0 && (
                  <div className="mb-6">
                    <SectionHeader title="系統管理" />
                    <div className="px-3 space-y-1">
                      {adminSection.map((link) => (
                        <NavigationItem
                          key={link.href}
                          item={link}
                          isActive={link.active || false}
                          onClick={() => handleNavItemClick(link)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Logout Section */}
                {logoutSection.length > 0 && (
                  <div className="mt-auto pt-6 border-t border-neutral-200/20 dark:border-neutral-700/30">
                    <div className="px-3">
                      {logoutSection.map((link) => (
                        <NavigationItem
                          key={link.href}
                          item={link}
                          isActive={false}
                          onClick={() => handleNavItemClick(link)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-neutral-200/20 dark:border-neutral-700/30">
                <ThemeToggle />
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  )
}

// Hook for managing scroll-based navigation state
export function useScrollNav() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { isScrolled }
}
