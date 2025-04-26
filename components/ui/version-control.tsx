'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './button'
import { Card } from './card'
import { ScrollArea } from './scroll-area'
import { useToast } from '../hooks/use-toast'

interface Version {
  id: string
  timestamp: string
  componentName: string
  code: string
  preview?: string
  metadata?: {
    author: string
    description?: string
  }
}

export function VersionControl({ 
  componentName, 
  currentCode 
}: { 
  componentName: string
  currentCode: string 
}) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadVersions()
  }, [componentName])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/versions/${componentName}`)
      if (!response.ok) throw new Error('Failed to load versions')
      const data = await response.json()
      setVersions(data.versions)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load version history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveVersion = async () => {
    try {
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName,
          code: currentCode,
          timestamp: new Date().toISOString(),
        }),
      })
      if (!response.ok) throw new Error('Failed to save version')
      await loadVersions()
      toast({
        title: 'Success',
        description: 'Version saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save version',
        variant: 'destructive',
      })
    }
  }

  const restoreVersion = async (version: Version) => {
    try {
      const response = await fetch(`/api/versions/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName,
          versionId: version.id,
        }),
      })
      if (!response.ok) throw new Error('Failed to restore version')
      await loadVersions()
      toast({
        title: 'Success',
        description: 'Version restored successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Version History</h3>
        <Button onClick={saveVersion}>Save Current Version</Button>
      </div>
      <ScrollArea className="h-[300px]">
        {versions.map((version) => (
          <div key={version.id} className="flex items-center justify-between p-3 border-b">
            <div>
              <p className="font-medium">{new Date(version.timestamp).toLocaleString()}</p>
              {version.metadata?.description && (
                <p className="text-sm text-gray-500">{version.metadata.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => restoreVersion(version)}>
                Restore
              </Button>
            </div>
          </div>
        ))}
        {versions.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-4">No versions found</p>
        )}
        {loading && <p className="text-center text-gray-500 py-4">Loading...</p>}
      </ScrollArea>
    </Card>
  )
}
