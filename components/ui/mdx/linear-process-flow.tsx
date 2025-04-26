'use client'

import React from 'react'
import { Card } from '../card'
import { cn } from '@/lib/utils'

interface Step {
  title: string
  description: string
  status?: 'completed' | 'current' | 'upcoming'
}

interface LinearProcessFlowProps {
  steps: Step[]
  currentStep?: number
  className?: string
}

export function LinearProcessFlow({
  steps,
  currentStep = 0,
  className
}: LinearProcessFlowProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-4",
              index < steps.length - 1 && "pb-4 border-b"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                index < currentStep && "bg-green-100 text-green-700",
                index === currentStep && "bg-blue-100 text-blue-700",
                index > currentStep && "bg-gray-100 text-gray-500"
              )}
            >
              {index + 1}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-medium",
                index < currentStep && "text-green-700",
                index === currentStep && "text-blue-700"
              )}>
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
