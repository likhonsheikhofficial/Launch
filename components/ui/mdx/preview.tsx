'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '../card'
import { Button } from '../button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
import { ScrollArea } from '../scroll-area'
import { Skeleton } from '../skeleton'
import { cn } from '@/lib/utils'
import { mdxComponents } from '.'

interface PreviewProps {
  code: string
  componentType: string
  language?: string
  className?: string
}

export function Preview({
  code,
  componentType,
  language = 'en',
  className
}: PreviewProps) {
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('preview')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generatePreview()
  }, [code, componentType])

  const generatePreview = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/mdx/component/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component: code,
          type: componentType,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate preview')
      }

      const data = await response.json()
      setPreview(data.preview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const PreviewComponent = mdxComponents[componentType]

  return (
    <Card className={cn('overflow-hidden', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between p-2 border-b">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            onClick={generatePreview}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
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
          ) : PreviewComponent ? (
            <PreviewComponent {...JSON.parse(preview)} />
          ) : (
            <div className="text-gray-500">
              Preview not available for this component type
            </div>
          )}
        </TabsContent>
        <TabsContent value="code" className="p-0">
          <ScrollArea className="h-[400px]">
            <pre className="p-4">
              <code className="language-typescript">{code}</code>
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
