'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimationConfig {
  duration?: number
  delay?: number
  easing?: (t: number) => number
  onComplete?: () => void
}

export function useAnimationFrame(callback: () => void, deps: any[] = []) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()
  const isActive = useRef(true)

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        if (isActive.current) {
          callback()
        }
      }
      previousTimeRef.current = time
      if (isActive.current) {
        requestRef.current = requestAnimationFrame(animate)
      }
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      isActive.current = false
    }
  }, [callback, ...deps])

  return {
    pause: () => {
      isActive.current = false
    },
    resume: () => {
      isActive.current = true
      requestRef.current = requestAnimationFrame((time) => {
        previousTimeRef.current = time
        if (isActive.current) {
          callback()
        }
      })
    },
    isPaused: () => !isActive.current
  }
}

export function useSmoothAnimation(config: AnimationConfig = {}) {
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef<number>()
  const { duration = 1000, delay = 0, easing = (t) => t, onComplete } = config

  const animate = useAnimationFrame(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now()
      return
    }

    const elapsed = performance.now() - startTimeRef.current - delay
    if (elapsed < 0) return

    const rawProgress = Math.min(elapsed / duration, 1)
    const easedProgress = easing(rawProgress)
    
    setProgress(easedProgress)

    if (rawProgress >= 1) {
      onComplete?.()
    }
  }, [duration, delay, easing, onComplete])

  return { progress, ...animate }
}

// Common easing functions
export const easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => 
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}
