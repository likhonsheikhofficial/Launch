'use client'

import React, { useState, useCallback } from 'react'
import { Editor } from '@monaco-editor/react'
import { Button } from '../button'
import { Preview } from './preview'
import { Card } from '../card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs'
import { componentMetadata } from '.'
import { useToast } from '@/hooks/use-toast'

interface MDXEditorProps {
  initialValue?: string
  onChange?: (value: string) => void
  className?: string
}

export function MDXEditor({
  initialValue = '',
  onChange,
  className
}: MDXEditorProps) {
  const [content, setContent] = useState(initialValue)
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const { toast } = useToast()

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setContent(value)
      onChange?.(value)
    }
  }, [onChange])

  const insertComponent = useCallback((componentType: string) => {
    const componentTemplate = `<${componentType}
  // Add your props here
/>
`
    setContent((prev) => prev + '\n\n' + componentTemplate)
    setSelectedComponent(null)
  }, [])

  const insertCodeBlock = useCallback((language: string, type: string) => {
    const codeBlockTemplate = `\`\`\`${language} type="${type}"
// Add your code here
\`\`\`
`
    setContent((prev) => prev + '\n\n' + codeBlockTemplate)
  }, [])

  const processContent = useCallback(async () => {
    try {
      const response = await fetch('/api/mdx/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to process MDX content')
      }

      const data = await response.json()
      setContent(data.content)
      toast({
        title: 'Success',
        description: 'MDX content processed successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process MDX content',
        variant: 'destructive',
      })
    }
  }, [content, toast])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Insert Component</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose a Component</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 p-4">
                {Object.entries(componentMetadata).map(([key, meta]) => (
                  <Card
                    key={key}
                    className="p-4 cursor-pointer hover:bg-accent"
                    onClick={() => insertComponent(key)}
                  >
                    <h3 className="font-medium">{meta.name}</h3>
                    <p className="text-sm text-muted-foreground">{meta.description}</p>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Insert Code Block</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Code Block Type</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="component">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="component">Component</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>
                <TabsContent value="component" className="p-4">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => insertCodeBlock('tsx', 'react')}
                    >
                      React Component
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => insertCodeBlock('js', 'nodejs')}
                    >
                      Node.js Code
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="other" className="p-4">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => insertCodeBlock('mermaid', 'diagram')}
                    >
                      Mermaid Diagram
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => insertCodeBlock('math', 'latex')}
                    >
                      Math Expression
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
        <Button onClick={processContent}>Process MDX</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <Editor
            height="600px"
            defaultLanguage="markdown"
            value={content}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
              theme: 'vs-dark'
            }}
          />
        </Card>          <LivePreview code={content} componentType={selectedComponent || 'default'} />
      </div>
    </div>
  )
}
