'use client'

import React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Card } from '../card'

interface CodeBlockProps {
  children: string
  language?: string
  type?: string
  project?: string
  file?: string
  className?: string
}

export function CodeBlock({
  children,
  language = 'typescript',
  type = 'code',
  project,
  file,
  className
}: CodeBlockProps) {
  return (
    <Card className={className}>
      {(project || file) && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted">
          {project && (
            <span className="text-sm text-muted-foreground">
              Project: {project}
            </span>
          )}
          {file && (
            <span className="text-sm text-muted-foreground">
              File: {file}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <SyntaxHighlighter
          language={language}
          style={tomorrow}
          customStyle={{
            margin: 0,
            borderRadius: 'calc(var(--radius) - 6px)',
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
      {type === 'diagram' && (
        <div className="p-4 border-t">
          {/* Mermaid diagram rendering will be implemented here */}
          <div className="text-sm text-muted-foreground">
            Diagram preview coming soon
          </div>
        </div>
      )}
    </Card>
  )
}
