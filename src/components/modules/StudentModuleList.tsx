'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookOpen, RefreshCw } from 'lucide-react'
import StudentModuleCard from './StudentModuleCard'

export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed'

export interface StudentModule {
  id: string
  title: string
  description: string | null
  orderIndex: number
  contentCount: number
  assignmentCount: number
  discussionCount: number
  progress: number
  status: ModuleStatus
  isUnlocked: boolean
  unlockMessage?: string
  prerequisiteModuleId?: string
  prerequisiteModuleTitle?: string
}

interface StudentModuleListProps {
  courseId: string
  onProgressUpdate?: (progress: number) => void
}

export default function StudentModuleList({
  courseId,
  onProgressUpdate,
}: StudentModuleListProps) {
  const [modules, setModules] = useState<StudentModule[]>([])
  const [courseProgress, setCourseProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/student/courses/${courseId}/modules`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch modules')
      }

      const data = await response.json()
      setModules(data.modules)
      setCourseProgress(data.courseProgress)
      onProgressUpdate?.(data.courseProgress)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch modules'
      setError(message)
      console.error('Error fetching student modules:', err)
    } finally {
      setLoading(false)
    }
  }, [courseId, onProgressUpdate])

  useEffect(() => {
    if (courseId) {
      fetchModules()
    }
  }, [courseId, fetchModules])

  // Loading State
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 border border-gray-200 rounded-lg animate-pulse"
          >
            <div className="flex items-start">
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-3"></div>
                <div className="flex gap-3">
                  <div className="h-4 bg-gray-100 rounded w-20"></div>
                  <div className="h-4 bg-gray-100 rounded w-20"></div>
                  <div className="h-4 bg-gray-100 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-red-400 mb-4">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-12 w-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-white">
          Failed to load modules
        </h3>
        <p className="mt-1 text-sm text-white/70">{error}</p>
        <div className="mt-6">
          <button
            onClick={fetchModules}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty State
  if (modules.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-white" />
        <h3 className="mt-2 text-sm font-medium text-white">
          No modules available yet
        </h3>
        <p className="mt-1 text-sm text-white/70">
          Your instructor hasn&apos;t published any modules for this course.
        </p>
      </div>
    )
  }

  // Module List
  return (
    <div className="space-y-3">
      {modules.map((module) => (
        <StudentModuleCard
          key={module.id}
          module={module}
          courseId={courseId}
        />
      ))}
    </div>
  )
}
