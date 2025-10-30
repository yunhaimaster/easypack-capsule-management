'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { NavDropdown } from '@/components/ui/nav-dropdown'
import { EnhancedMobileNav } from '@/components/ui/enhanced-mobile-nav'
import { getMainNavigationLinks, type NavigationLink } from '@/data/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Menu, X, ChevronDown, Library, Sparkles, FlaskConical, Palette, Calendar } from 'lucide-react'
import { Route } from 'next'
import { ThemeToggle } from '@/components/theme/theme-toggle'

type NavLink = NavigationLink & {
  active?: boolean
}

// Icon mapping for mobile navigation
const iconMap = {
  Library,
  Sparkles,
  FlaskConical,
  Palette,
  Calendar
}

interface LiquidGlassNavProps {
  logo?: React.ReactNode
  links?: NavLink[]
  className?: string
}

export function LiquidGlassNav({
  logo = <Logo />,
  links,
  className = ''
}: LiquidGlassNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)
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

  return (
    <EnhancedMobileNav
      logo={logo}
      links={processedLinks}
      className={className}
    />
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
