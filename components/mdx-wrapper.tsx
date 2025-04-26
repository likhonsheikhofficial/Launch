'use client'

import React from 'react'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from './ui/mdx'

interface MDXWrapperProps {
  children: React.ReactNode
}

export function MDXWrapper({ children }: MDXWrapperProps) {
  return (
    <MDXProvider components={mdxComponents}>
      {children}
    </MDXProvider>
  )
}
