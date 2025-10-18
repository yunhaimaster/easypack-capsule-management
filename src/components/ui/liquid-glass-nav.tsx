'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { NavDropdown } from '@/components/ui/nav-dropdown'
import { getMainNavigationLinks, type NavigationLink } from '@/data/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Menu, X, ChevronDown, Library, Sparkles, FlaskConical, Palette } from 'lucide-react'
import { Route } from 'next'

type NavLink = NavigationLink & {
  active?: boolean
}

// Icon mapping for mobile navigation
const iconMap = {
  Library,
  Sparkles,
  FlaskConical,
  Palette
}

interface LiquidGlassNavProps {
  logo?: React.ReactNode
  links?: NavLink[]
  className?: string
}

export function LiquidGlassNav({
  logo = <Logo />,
  links = getMainNavigationLinks(),
  className = ''
}: LiquidGlassNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const { logout } = useAuth()

  // Auto-detect active link based on current pathname
  const processedLinks = links.map(link => ({
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

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-white/90 focus:text-neutral-900 focus:shadow-lg transition" aria-label="跳至主要內容">
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
              <h1 className="text-[11px] sm:text-sm md:text-base lg:text-lg font-bold text-neutral-900">
                Easy Health
              </h1>
              <p className="hidden sm:block text-xs md:text-sm text-neutral-600">
                膠囊配方管理系統
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links - Right side */}
          <div className="liquid-glass-nav-links">
            {processedLinks.map((link) => (
              link.children ? (
                <NavDropdown
                  key={link.href}
                  label={link.label}
                  items={link.children}
                  active={link.active}
                />
              ) : (
                <Link
                  key={link.href}
                  href={link.href as Route}
                  className={`liquid-glass-nav-link ${link.active ? 'active' : ''}`}
                  onClick={(event) => {
                    if (link.label === '登出') {
                      event.preventDefault()
                      logout()
                      setIsMobileMenuOpen(false)
                      setTimeout(() => window.location.assign('/login?logout=true'), 50)
                    }
                  }}
                  aria-current={link.active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              )
            ))}
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

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="liquid-glass-nav-mobile">
            {processedLinks.map((link) => (
              <div key={link.href}>
                {link.children ? (
                  <div className="space-y-1">
                    <div className="px-4 py-3 text-sm font-semibold text-neutral-600 bg-neutral-50/50 border-b border-neutral-200/50">
                      {link.label}
                    </div>
                    {link.children.map((child) => {
                      const IconComponent = child.icon ? iconMap[child.icon as keyof typeof iconMap] : null
                      return (
                        <Link
                          key={child.href}
                          href={child.href as Route}
                          className="liquid-glass-nav-link flex items-center pl-8 py-3 bg-white/30 hover:bg-white/50 transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {IconComponent && (
                            <IconComponent className="h-4 w-4 mr-3 text-neutral-500" />
                          )}
                          <span>{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <Link
                    href={link.href as Route}
                    className={`liquid-glass-nav-link ${link.active ? 'active' : ''} px-4 py-3`}
                    onClick={(event) => {
                      setIsMobileMenuOpen(false)
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
                )}
              </div>
            ))}
          </div>
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
