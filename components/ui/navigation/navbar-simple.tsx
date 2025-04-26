'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '../button'
import { SearchIcon, GithubIcon } from 'lucide-react'

interface SimpleNavbarProps {
  showSearch?: boolean
  className?: string
}

export function SimpleNavbar({ showSearch = true, className }: SimpleNavbarProps) {
  return (
    <header className={cn(
      'sticky top-0 z-40 w-full border-b bg-background',
      className
    )}>
      <div className="container flex h-12 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="font-semibold">
            Launch
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="/docs" className="transition-colors hover:text-primary">
              Documentation
            </a>
            <a href="/components" className="transition-colors hover:text-primary">
              Components
            </a>
            <a href="/examples" className="transition-colors hover:text-primary">
              Examples
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <Button variant="ghost" size="sm" className="w-9 px-0">
              <SearchIcon className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          )}
          <a
            href="https://github.com/your-repo"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="sm" className="w-9 px-0">
              <GithubIcon className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}
