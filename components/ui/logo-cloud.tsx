'use client'import React from 'react'import { Card } from '../card'import { cn } from '@/lib/utils'import { useSmoothAnimation, easings } from '@/hooks/use-animation'interface Logo {  src: string  alt: string  width?: number  height?: number}interface LogoCloudProps {  logos: Logo[]  className?: string  speed?: 'slow' | 'normal' | 'fast'}const speedMap = {  slow: 40000,  normal: 30000,  fast: 20000,}export function LogoCloud({   logos,   className,  speed = 'normal'}: LogoCloudProps) {  const { progress: row1Progress } = useSmoothAnimation({    duration: speedMap[speed],    easing: easings.linear,  })  const { progress: row2Progress } = useSmoothAnimation({    duration: speedMap[speed],    easing: easings.linear,  })  return (    <div className={cn('w-full overflow-hidden bg-background/50 py-12', className)}>      <div className="relative max-w-7xl mx-auto px-4">        {/* First row - left to right */}        <div className="flex space-x-8 mb-8">          <div             className="flex space-x-8 animate-none"            style={{              transform: `translateX(-${row1Progress * 100}%)`,              willChange: 'transform',            }}          >            {[...logos, ...logos].map((logo, index) => (              <Card                key={`row1-${index}`}                className={cn(                  'flex items-center justify-center w-32 h-20 shrink-0',                  'rounded-lg bg-background/50 p-4',                  'transition-all duration-300 hover:scale-110 hover:bg-background'
                )}
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width || 128}
                  height={logo.height || 80}
                  className="object-contain w-full h-full transition-opacity"
                />
              </Card>
            ))}
          </div>
        </div>

        {/* Second row - right to left */}
        <div className="flex space-x-8">
          <div 
            className="flex space-x-8 animate-none"
            style={{
              transform: `translateX(${row2Progress * 100}%)`,
              willChange: 'transform',
            }}
          >
            {[...logos, ...logos].map((logo, index) => (
              <Card
                key={`row2-${index}`}
                className={cn(
                  'flex items-center justify-center w-32 h-20 shrink-0',
                  'rounded-lg bg-background/50 p-4',
                  'transition-all duration-300 hover:scale-110 hover:bg-background'
                )}
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width || 128}
                  height={logo.height || 80}
                  className="object-contain w-full h-full transition-opacity"
                />
              </Card>
            ))}
          </div>
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  )
}
