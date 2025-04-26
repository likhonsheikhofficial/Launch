'use client'

import React, { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface MathProps {
  children: string
  display?: boolean
  className?: string
}

export function Math({ children, display = false, className = '' }: MathProps) {
  const mathRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mathRef.current) {
      katex.render(children, mathRef.current, {
        throwOnError: false,
        displayMode: display,
      })
    }
  }, [children, display])

  return <div ref={mathRef} className={className} />
}
