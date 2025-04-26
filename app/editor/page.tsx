'use client'

import React from 'react'
import { MDXEditor } from '@/components/ui/mdx/editor'
import { VersionControl } from '@/components/ui/version-control'

export default function EditorPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-6">Launch MDX Editor</h1>
          <MDXEditor />
        </div>
        <div className="w-80">
          <VersionControl 
            componentName="mdx-editor" 
            currentCode="" 
          />
        </div>
      </div>
    </div>
  )
}
