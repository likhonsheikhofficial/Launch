'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '../button'
import { HomeIcon, SearchIcon, PlusIcon, BellIcon, UserIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface BottomNavProps {
  className?: string
  notifications?: number
}

export function BottomNav({ className, notifications = 0 }: BottomNavProps) {
  const navItems = [
    { icon: HomeIcon, label: 'Home', href: '/' },
    { icon: SearchIcon, label: 'Search', href: '/search' },
    { icon: PlusIcon, label: 'Create', href: '/create' },
    { icon: BellIcon, label: 'Notifications', href: '/notifications', badge: notifications },
    { icon: UserIcon, label: 'Profile', href: '/profile' },
  ]

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden',
      className
    )}>
      <div className="container flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="lg"
            className="relative h-16 w-16"
            asChild
          >
            <a href={item.href}>
              <span className="flex flex-col items-center gap-1">
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </span>
              {item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2 top-2 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center"
                >
                  {item.badge}
                </motion.span>
              )}
            </a>
          </Button>
        ))}
      </div>
    </nav>
  )
}
