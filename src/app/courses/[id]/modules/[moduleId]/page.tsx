'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import StudentContentItem from '@/components/modules/StudentContentItem'
import CourseProgressBar from '@/components/modules/CourseProgressBar'
import ModuleSidebar from '@/components/modules/ModuleSidebar'
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Lock,
  Menu,
  X,
} from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  type: 'TEXT' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'SCORM' | 'YOUTUBE'
  thumbnailUrl: string | null
  orderIndex: number
  isViewed: boolean
}

interface AssignmentItem {
  id: string
  title: string
  dueDate: string | null
  maxPoints: number
  isSubmitted: boolean
  isGraded: boolean
  grade: number | null
}

interface DiscussionItem {
  id: string
  title: string
  postCount: number
}

interface ModuleData {
  id: string
  title: string
  description: string | null
  progress: number
  content: ContentItem[]
  assignments: AssignmentItem[]
  discussions: DiscussionItem[]
}

interface CourseInfo {
  id: string
  title: string
}

interface ModuleListItem {
  id: string
  title: string
  orderIndex: number
  progress: number
  isUnlocked: boolean
}

export default function StudentModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const moduleId = params.moduleId as string

  const [moduleData, setModuleData] = useState<ModuleData | null>(null)
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null)
  const [modulesList, setModulesList] = useState<ModuleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockMessage, setLockMessage] = useState<string | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const fetchModulesList = async () => {
    try {
      const response = await fetch(`/api/student/courses/${courseId}/modules`)
      if (response.ok) {
        const data = await response.json()
        setModulesList(data.modules || [])
      }
    } catch (err) {
      console.error('Error fetching modules list:', err)
    }
  }

  const fetchModuleData = async () => {
    setLoading(true)
    setError(null)
    setIsLocked(false)

    try {
      const response = await fetch(
        `/api/student/courses/${courseId}/modules/${moduleId}`
      )

      if (response.status === 403) {
        const data = await response.json()
        if (data.error === 'MODULE_LOCKED') {
          setIsLocked(true)
          setLockMessage(data.message)
          return
        }
        throw new Error(data.message || 'Access denied')
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch module')
      }

      const data = await response.json()
      setModuleData(data.module)
      setCourseInfo(data.course)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch module'
      setError(message)
      console.error('Error fetching module detail:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (courseId && moduleId) {
      fetchModuleData()
      fetchModulesList()
    }
  }, [courseId, moduleId])

  // Locked State
  if (isLocked) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 sm:px-0">
              <Breadcrumb
                items={[
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Course', href: `/courses/${courseId}` },
                  { label: 'Module' },
                ]}
              />
            </div>

            <div className="mt-6 px-4 sm:px-0">
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Lock className="h-8 w-8 text-gray-500" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Module Locked
                </h2>
                <p className="text-gray-600 mb-6">
                  {lockMessage || 'Complete the previous module to unlock this one.'}
                </p>
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Link>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // Loading State
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 sm:px-0">
              <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
              <div className="bg-white shadow rounded-lg p-6 mb-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // Error State
  if (error) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 sm:px-0">
              <div className="bg-white shadow rounded-lg p-8 text-center">
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to load module
                </h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={fetchModuleData}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </button>
                  <Link
                    href={`/courses/${courseId}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!moduleData) return null

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb (AC-1: Course > Module format) */}
          <div className="px-4 sm:px-0">
            <Breadcrumb
              items={generateBreadcrumbs.studentModule(
                courseId,
                courseInfo?.title,
                moduleId,
                moduleData.title
              )}
            />
          </div>

          {/* Mobile sidebar toggle button */}
          <div className="mt-4 px-4 sm:px-0 md:hidden">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 min-h-[44px]"
              aria-label="Toggle module navigation"
            >
              {isMobileSidebarOpen ? (
                <>
                  <X className="h-5 w-5" />
                  <span>Close Navigation</span>
                </>
              ) : (
                <>
                  <Menu className="h-5 w-5" />
                  <span>Module Navigation</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile sidebar overlay */}
          {isMobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileSidebarOpen(false)}>
              <div className="fixed inset-y-0 left-0 w-80 max-w-[80vw] bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Module Navigation</h2>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close navigation"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <ModuleSidebar
                  courseId={courseId}
                  modules={modulesList.map(m => ({
                    id: m.id,
                    title: m.title,
                    orderIndex: m.orderIndex,
                    isLocked: !m.isUnlocked,
                    progress: m.progress,
                  }))}
                  currentModuleId={moduleId}
                  isInstructor={false}
                />
              </div>
            </div>
          )}

          {/* Desktop layout with sidebar */}
          <div className="mt-6 px-4 sm:px-0 flex gap-6">
            {/* Desktop sidebar - hidden on mobile */}
            <aside className="hidden md:block w-80 flex-shrink-0">
              <div className="sticky top-6">
                <ModuleSidebar
                  courseId={courseId}
                  modules={modulesList.map(m => ({
                    id: m.id,
                    title: m.title,
                    orderIndex: m.orderIndex,
                    isLocked: !m.isUnlocked,
                    progress: m.progress,
                  }))}
                  currentModuleId={moduleId}
                  isInstructor={false}
                />
              </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 min-w-0">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {moduleData.title}
                  </h1>
                  {moduleData.description && (
                    <p className="mt-2 text-gray-600">{moduleData.description}</p>
                  )}
                </div>
                <Link
                  href={`/courses/${courseId}`}
                  className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Link>
              </div>

              {/* Module Progress */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <CourseProgressBar
                  progress={moduleData.progress}
                  label="Module Progress"
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-500" />
                Content ({moduleData.content.length})
              </h2>

              {moduleData.content.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No content yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your instructor hasn&apos;t added content to this module.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moduleData.content.map((item) => (
                    <StudentContentItem
                      key={item.id}
                      item={item}
                      courseId={courseId}
                      moduleId={moduleId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Assignments Section */}
            {moduleData.assignments.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-gray-500" />
                  Assignments ({moduleData.assignments.length})
                </h2>

                <div className="space-y-3">
                  {moduleData.assignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/courses/${courseId}/assignments/${assignment.id}`}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-all"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {assignment.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          {assignment.dueDate && (
                            <span>
                              Due:{' '}
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span>{assignment.maxPoints} points</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.isGraded ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Graded: {assignment.grade}/{assignment.maxPoints}
                          </span>
                        ) : assignment.isSubmitted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not submitted
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Discussions Section */}
            {moduleData.discussions.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  Discussions ({moduleData.discussions.length})
                </h2>

                <div className="space-y-3">
                  {moduleData.discussions.map((discussion) => (
                    <Link
                      key={discussion.id}
                      href={`/courses/${courseId}/discussions/${discussion.id}`}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-all"
                    >
                      <h4 className="font-medium text-gray-900">
                        {discussion.title}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {discussion.postCount} post{discussion.postCount !== 1 ? 's' : ''}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            </div>
            {/* End main content area */}
          </div>
          {/* End desktop layout with sidebar */}
        </main>
      </div>
    </ProtectedRoute>
  )
}
