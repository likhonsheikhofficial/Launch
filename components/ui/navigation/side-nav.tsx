'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '../scroll-area'
import { Button } from '../button'
import { ChevronDownIcon } from 'lucide-react'

interface NavItem {
  title: string
  href?: string
  items?: NavItem[]
  label?: string
}

interface SideNavProps {
  items: NavItem[]
  className?: string
  activeHref?: string
}

export function SideNav({ items, className, activeHref }: SideNavProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})

  const toggleExpanded = (title: string) => {
    setExpanded(prev => ({ ...prev, [title]: !prev[title] }))
  }

  const NavItems = ({ items: navItems, level = 0 }: { items: NavItem[], level?: number }) => (
    <>
      {navItems.map((item, index) => {
        const isActive = item.href === activeHref
        const isExpanded = expanded[item.title]
        const hasItems = item.items && item.items.length > 0

        return (
          <div key={index} className={cn("flex flex-col", level > 0 && "ml-4")}>
            <div className="flex items-center">
              {hasItems ? (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between font-normal",
                    isActive && "font-medium text-primary",
                  )}
                  onClick={() => toggleExpanded(item.title)}
                >
                  <span>{item.title}</span>
                  <ChevronDownIcon
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </Button>
              ) : (
                <a
                  href={item.href}
                  className={cn(
                    "flex w-full py-2 px-2 text-sm hover:underline",
                    isActive && "font-medium text-primary",
                    !isActive && "text-muted-foreground"
                  )}
                >
                  {item.title}
                  {item.label && (
                    <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {item.label}
                    </span>
                  )}
                </a>
              )}
            </div>
            {hasItems && isExpanded && (
              <div className="mt-1">
                <NavItems items={item.items} level={level + 1} />
              </div>
            )}
          </div>
        )
      })}
    </>
  )

  return (
    <nav className={cn("h-full py-6", className)}>
      <ScrollArea className="h-full pr-6">
        <NavItems items={items} />
      </ScrollArea>
    </nav>
  )
}
