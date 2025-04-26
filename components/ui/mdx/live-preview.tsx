'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
import { ThreeScene } from '../visualization/three-scene'
import { Skeleton } from '../skeleton'

interface LivePreviewProps {
  code: string
  componentType: string
  className?: string
}

export function LivePreview({
  code,
  componentType,
  className
}: LivePreviewProps) {
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [visualData, setVisualData] = useState(null)
  const [activeTab, setActiveTab] = useState('preview')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return
    generatePreview()
  }, [code, componentType])

  const generatePreview = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/mdx/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          type: componentType,
          generateVisualization: true // Request visualization data
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate preview')
      }

      const data = await response.json()
      setPreview(data.preview)
      
      // Update visualization data if available
      if (data.visualData) {
        setVisualData(data.visualData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="visualization">3D View</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="p-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">
              Error: {error}
            </div>
          ) : (
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          )}
        </TabsContent>

        <TabsContent value="visualization" className="p-4">
          <ThreeScene 
            data={visualData}
            width={600}
            height={400}
            className="w-full h-[400px]"
          />
        </TabsContent>

        <TabsContent value="metrics" className="p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Component Metrics</h3>
            {loading ? (
              <Skeleton className="h-[200px]" />
            ) : (
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span>Render Time</span>
                  <span className="font-mono">124ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bundle Size</span>
                  <span className="font-mono">4.2KB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Elements</span>
                  <span className="font-mono">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Accessibility Score</span>
                  <span className="font-mono">98/100</span>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
