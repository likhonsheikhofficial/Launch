'use client'

import React, { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { Card } from '../card'
import { cn } from '@/lib/utils'

interface MermaidProps {
  chart: string
  title?: string
  className?: string
}

export function Mermaid({ chart, title, className }: MermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'strict',
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
        },
      })

      const renderChart = async () => {
        try {
          const { svg } = await mermaid.render('mermaid-svg', chart)
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg
          }
        } catch (error) {
          console.error('Failed to render Mermaid chart:', error)
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `
              <div class="p-4 text-red-500">
                Error rendering diagram. Please check your Mermaid syntax.
              </div>
            `
          }
        }
      }

      renderChart()
    }
  }, [chart])

  return (
    <Card className={cn("p-4", className)}>
      {title && (
        <div className="mb-4 font-medium text-lg">{title}</div>
      )}
      <div ref={mermaidRef} className="flex justify-center" />
    </Card>
  )
}
