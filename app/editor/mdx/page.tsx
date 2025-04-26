'use client'

import React, { useState } from 'react'
import { MDXEditor } from '@/components/ui/mdx/editor'
import { VersionControl } from '@/components/ui/version-control'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function MDXEditorPage() {
  const [content, setContent] = useState('')
  const [activeTab, setActiveTab] = useState('editor')
  const { toast } = useToast()

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/mdx/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }

      toast({
        title: 'Success',
        description: 'Content saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save content',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">MDX Editor</h1>
          <Button onClick={handleSave}>Save</Button>
        </div>

        <div className="grid grid-cols-[1fr,300px] gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="mt-4">
              <Card className="p-4">
                <MDXEditor 
                  initialValue={content} 
                  onChange={handleContentChange} 
                />
              </Card>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <Card className="p-4 prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </Card>
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <VersionControl
              componentName="mdx-editor"
              currentCode={content}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
