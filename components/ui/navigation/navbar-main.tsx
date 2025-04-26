'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '../button'
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from '../navigation-menu'
import { MoonIcon, SunIcon, MenuIcon, XIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Sheet, SheetContent, SheetTrigger } from '../sheet'

interface NavItem {
  title: string
  href: string
  description?: string
  children?: NavItem[]
}

interface NavbarProps {
  items?: NavItem[]
  className?: string
}

export function MainNavbar({ items = [], className }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const defaultItems: NavItem[] = [
    {
      title: 'Features',
      href: '#',
      children: [
        {
          title: 'AI Development',
          href: '/features/ai',
          description: 'Build with artificial intelligence'
        },
        {
          title: 'Components',
          href: '/features/components',
          description: 'Pre-built UI components'
        }
      ]
    },
    {
      title: 'Documentation',
      href: '/docs'
    },
    {
      title: 'Pricing',
      href: '/pricing'
    }
  ]

  const navItems = items.length ? items : defaultItems

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <div className="mr-4 flex items-center space-x-2">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Launch</span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.children ? (
                    <>
                      <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                          {item.children.map((child) => (
                            <li key={child.title}>
                              <NavigationMenuLink asChild>
                                <a
                                  href={child.href}
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                >
                                  <div className="text-sm font-medium leading-none">{child.title}</div>
                                  {child.description && (
                                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                      {child.description}
                                    </p>
                                  )}
                                </a>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </>
                  ) : (
                    <NavigationMenuLink asChild>
                      <a
                        href={item.href}
                        className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                      >
                        {item.title}
                      </a>
                    </NavigationMenuLink>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Theme Toggle and Mobile Menu */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <div key={item.title} className="space-y-4">
                    <a
                      href={item.href}
                      className="text-lg font-medium hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.title}
                    </a>
                    {item.children && (
                      <div className="ml-4 space-y-2">
                        {item.children.map((child) => (
                          <a
                            key={child.title}
                            href={child.href}
                            className="block text-sm text-muted-foreground hover:text-primary"
                            onClick={() => setIsOpen(false)}
                          >
                            {child.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
