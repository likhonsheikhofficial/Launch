'use client'

import React from 'react'
import { Card } from '../card'
import { cn } from '@/lib/utils'
import { useSmoothAnimation, easings } from '@/hooks/use-animation'

interface SkewedScrollItem {
  title: string
  description: string
  icon?: React.ReactNode
}

interface SkewedScrollProps {
  items: SkewedScrollItem[]
  className?: string
  duration?: number
}

export function SkewedScroll({ 
  items, 
  className, 
  duration = 20000 
}: SkewedScrollProps) {
  const { progress, isPaused, pause, resume } = useSmoothAnimation({
    duration,
    easing: easings.linear,
  })

  // Calculate dynamic transform values
  const translateY = progress * 100
  const skewX = Math.sin(progress * Math.PI) * 5
  const baseTransform = `
    translateY(-${translateY}%) 
    rotatex(20deg) 
    rotateZ(-20deg) 
    skewX(${20 + skewX}deg)
  `

  return (
    <div className={cn('relative h-[400px] overflow-hidden', className)}>
      {/* Gradient overlay - top */}
      <div 
        className="absolute inset-0 z-10 bg-gradient-to-t from-transparent via-background/50 to-background" 
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Content container */}
      <div 
        className="relative flex flex-col gap-4 transform-gpu"
        style={{ 
          transform: baseTransform,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          willChange: 'transform',
        }}
        onMouseEnter={() => pause()}
        onMouseLeave={() => resume()}
      >
        {/* Doubled items for seamless loop */}
        {[...items, ...items].map((item, index) => (
          <Card
            key={`${index}-${item.title}`}
            className={cn(
              'p-6 backdrop-blur-sm bg-background/80 border-primary/20',
              'transition-all duration-200',
              isPaused && 'scale-[1.02] border-primary/40'
            )}
          >
            <div className="flex items-start gap-4">
              {item.icon && (
                <div className="p-2 rounded-lg bg-primary/10">
                  {item.icon}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gradient overlay - bottom */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" 
        style={{ transform: 'translateZ(0)' }}
      />
    </div>
  )
}
