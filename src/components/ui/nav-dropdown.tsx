'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Library, Sparkles, FlaskConical, Palette } from 'lucide-react'
import { Route } from 'next'
import { Card } from '@/components/ui/card'

import { type NavigationLink } from '@/data/navigation'

interface NavDropdownProps {
  label: string
  items: NavigationLink[]
  active?: boolean
}

// Icon mapping for dropdown items
const iconMap = {
  Library,
  Sparkles,
  FlaskConical,
  Palette
}

export function NavDropdown({ label, items, active = false }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`liquid-glass-nav-link flex items-center space-x-1 ${
          active ? 'active' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{label}</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <Card 
          variant="dropdown" 
          interactive={false}
          className="absolute top-full left-0 mt-2 w-48 z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200"
        >
          {items.map((child) => {
            const IconComponent = child.icon ? iconMap[child.icon as keyof typeof iconMap] : null
            return (
              <Link
                key={child.href}
                href={child.href as Route}
                className="liquid-glass-nav-link-with-icon flex items-center px-4 py-3 text-sm text-neutral-700 dark:text-white/75 hover:bg-surface-primary/50 dark:hover:bg-elevation-2 transition-all duration-200"
                onClick={() => setIsOpen(false)}
                aria-label={`前往 ${child.label}`}
              >
                {IconComponent && (
                  <IconComponent className="h-4 w-4 mr-3 text-neutral-500 dark:text-white/55" />
                )}
                <span>{child.label}</span>
              </Link>
            )
          })}
        </Card>
      )}
    </div>
  )
}
