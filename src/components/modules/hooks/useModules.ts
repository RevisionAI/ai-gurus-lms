'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Module {
  id: string
  title: string
  description: string | null
  orderIndex: number
  isPublished: boolean
  requiresPrevious: boolean
  createdAt: string
  updatedAt: string
  contentCount: number
  assignmentCount: number
  discussionCount: number
}

interface UseModulesReturn {
  modules: Module[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useModules(courseId: string): UseModulesReturn {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    if (!courseId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/modules`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch modules')
      }

      const data = await response.json()
      // Modules come pre-sorted by orderIndex from API, but ensure sorting
      const sortedModules = (data.modules || []).sort(
        (a: Module, b: Module) => a.orderIndex - b.orderIndex
      )
      setModules(sortedModules)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching modules:', err)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  return {
    modules,
    loading,
    error,
    refetch: fetchModules,
  }
}
