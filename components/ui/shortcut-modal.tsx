'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog'
import { ScrollArea } from '../scroll-area'
import { Card } from '../card'

interface ShortcutItem {
  key: string
  description: string
  category: string
}

interface ShortcutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcuts: ShortcutItem[]
}

export function ShortcutModal({
  open,
  onOpenChange,
  shortcuts,
}: ShortcutModalProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, ShortcutItem[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold mb-3">{category}</h3>
                <div className="space-y-2">
                  {items.map((shortcut) => (
                    <Card key={shortcut.key} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                          {shortcut.key}
                        </kbd>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
