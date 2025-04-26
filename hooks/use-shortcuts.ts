'use client'

import { useEffect, useState } from 'react'

interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  preventDefault?: boolean
  category: string
  description: string
  action: () => void
}

export function useShortcuts(shortcuts: ShortcutConfig[]) {
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Show shortcuts modal on Cmd/Ctrl + K
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setModalOpen(true)
        return
      }

      // Check for registered shortcuts
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey)
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey
        const altMatch = !!shortcut.altKey === event.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault) {
            event.preventDefault()
          }
          shortcut.action()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])

  // Format shortcuts for display
  const formattedShortcuts = shortcuts.map(shortcut => {
    const keys = []
    if (shortcut.ctrlKey) keys.push('⌘')
    if (shortcut.shiftKey) keys.push('⇧')
    if (shortcut.altKey) keys.push('⌥')
    keys.push(shortcut.key.toUpperCase())

    return {
      key: keys.join(' + '),
      description: shortcut.description,
      category: shortcut.category
    }
  })

  return {
    modalOpen,
    setModalOpen,
    shortcuts: formattedShortcuts
  }
}
