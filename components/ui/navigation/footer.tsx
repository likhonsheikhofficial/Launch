'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '../button'
import { Input } from '../input'
import {
  GithubIcon,
  TwitterIcon,
  LinkedinIcon,
  YoutubeIcon,
  SendIcon
} from 'lucide-react'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-t bg-background', className)}>
      <div className="container px-4 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Launch</h3>
            <p className="text-sm text-muted-foreground">
              Building the future of AI-powered development tools and frameworks.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com" target="_blank" rel="noreferrer">
                  <GithubIcon className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://twitter.com" target="_blank" rel="noreferrer">
                  <TwitterIcon className="h-4 w-4" />
                  <span className="sr-only">Twitter</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                  <LinkedinIcon className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://youtube.com" target="_blank" rel="noreferrer">
                  <YoutubeIcon className="h-4 w-4" />
                  <span className="sr-only">YouTube</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Resources Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/docs" className="text-muted-foreground hover:text-primary">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </a>
              </li>
              <li>
                <a href="/tutorials" className="text-muted-foreground hover:text-primary">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="/showcase" className="text-muted-foreground hover:text-primary">
                  Showcase
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/about" className="text-muted-foreground hover:text-primary">
                  About
                </a>
              </li>
              <li>
                <a href="/careers" className="text-muted-foreground hover:text-primary">
                  Careers
                </a>
              </li>
              <li>
                <a href="/contact" className="text-muted-foreground hover:text-primary">
                  Contact
                </a>
              </li>
              <li>
                <a href="/press" className="text-muted-foreground hover:text-primary">
                  Press Kit
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter for updates and news.
            </p>
            <form className="flex space-x-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="max-w-[220px]"
              />
              <Button type="submit" size="icon">
                <SendIcon className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Launch. All rights reserved.
            </p>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-primary">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-primary">
                Terms of Service
              </a>
              <a href="/cookies" className="hover:text-primary">
                Cookie Policy
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
