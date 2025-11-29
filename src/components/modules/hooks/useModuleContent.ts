'use client'

import { useState, useCallback } from 'react'

export interface ModuleContent {
  id: string
  title: string
  type: 'TEXT' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'SCORM' | 'YOUTUBE'
  content: string | null
  fileUrl: string | null
  thumbnailUrl: string | null
  orderIndex: number
  isPublished: boolean
  createdAt: string
  moduleId: string | null
}

interface UseModuleContentReturn {
  content: ModuleContent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setContent: React.Dispatch<React.SetStateAction<ModuleContent[]>>
}

export function useModuleContent(
  courseId: string,
  moduleId: string
): UseModuleContentReturn {
  const [content, setContent] = useState<ModuleContent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    if (!courseId || !moduleId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/instructor/courses/${courseId}/modules/${moduleId}/content`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch content')
      }

      const data = await response.json()
      const sortedContent = (data.content || []).sort(
        (a: ModuleContent, b: ModuleContent) => a.orderIndex - b.orderIndex
      )
      setContent(sortedContent)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching module content:', err)
    } finally {
      setLoading(false)
    }
  }, [courseId, moduleId])

  return {
    content,
    loading,
    error,
    refetch: fetchContent,
    setContent,
  }
}
