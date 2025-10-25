import * as React from "react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { Route } from "next"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: Route | string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-neutral-600 dark:text-white/75", className)}>
      <Link href="/" className="flex items-center hover:text-neutral-900 dark:text-white/95 transition-colors">
        <Home className="h-4 w-4" />
        <span className="ml-1">首頁</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link 
              href={item.href as Route}
              className="hover:text-neutral-900 dark:text-white/95 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-900 dark:text-white/95 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
