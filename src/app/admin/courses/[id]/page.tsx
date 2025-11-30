/**
 * Admin Course Detail Page
 *
 * Comprehensive view for managing a single course including:
 * - Course overview and settings
 * - Modules management
 * - Content management
 * - Assignments management
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  FileText,
  ClipboardList,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  RefreshCw,
  X,
  Calendar,
  Users,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Breadcrumb from '@/components/Breadcrumb'

// ============================================
// Types
// ============================================

interface Module {
  id: string
  title: string
  description: string | null
  orderIndex: number
  isPublished: boolean
  requiresPrevious: boolean
  contentCount: number
  assignmentCount: number
  discussionCount: number
}

interface Content {
  id: string
  title: string
  type: string
  isPublished: boolean
  orderIndex: number
  moduleId: string | null
  module: { id: string; title: string } | null
}

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxPoints: number
  isPublished: boolean
  moduleId: string | null
  module: { id: string; title: string } | null
  submissionCount: number
  gradeCount: number
}

interface CourseDetail {
  id: string
  title: string
  code: string
  description: string | null
  semester: string
  year: number
  isActive: boolean
  instructor: {
    id: string
    name: string
    surname: string
    email: string
  }
  _count: {
    enrollments: number
    assignments: number
    discussions: number
    announcements: number
    course_content: number
    modules: number
  }
  modules: Module[]
}

type TabType = 'overview' | 'modules' | 'content' | 'assignments'

// ============================================
// Main Component
// ============================================

export default function AdminCourseDetailPage() {
  const params = useParams()
  const courseId = params.id as string
  const router = useRouter()
  const { data: session, status } = useSession()

  // State
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [content, setContent] = useState<Content[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [deletingModule, setDeletingModule] = useState<Module | null>(null)

  const [showContentModal, setShowContentModal] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [deletingContent, setDeletingContent] = useState<Content | null>(null)

  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null)

  /**
   * Fetch course details
   */
  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch course')
      }

      setCourse(data.data)
      setModules(data.data.modules || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [courseId])

  /**
   * Fetch modules
   */
  const fetchModules = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules`)
      const data = await response.json()

      if (response.ok) {
        setModules(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch modules:', err)
    }
  }, [courseId])

  /**
   * Fetch content
   */
  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/content`)
      const data = await response.json()

      if (response.ok) {
        setContent(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch content:', err)
    }
  }, [courseId])

  /**
   * Fetch assignments
   */
  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/assignments`)
      const data = await response.json()

      if (response.ok) {
        setAssignments(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
    }
  }, [courseId])

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      toast.error('Admin access required')
      return
    }
  }, [session, status, router])

  // Fetch data
  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      setIsLoading(true)
      Promise.all([fetchCourse(), fetchModules(), fetchContent(), fetchAssignments()])
        .finally(() => setIsLoading(false))
    }
  }, [session, fetchCourse, fetchModules, fetchContent, fetchAssignments])

  /**
   * Handle module delete
   */
  const handleDeleteModule = async () => {
    if (!deletingModule) return

    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/modules/${deletingModule.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete module')
      }

      toast.success('Module deleted successfully')
      setDeletingModule(null)
      fetchModules()
      fetchCourse()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete module')
    }
  }

  /**
   * Handle content delete
   */
  const handleDeleteContent = async () => {
    if (!deletingContent) return

    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/content/${deletingContent.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete content')
      }

      toast.success('Content deleted successfully')
      setDeletingContent(null)
      fetchContent()
      fetchCourse()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete content')
    }
  }

  /**
   * Handle assignment delete
   */
  const handleDeleteAssignment = async () => {
    if (!deletingAssignment) return

    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/assignments/${deletingAssignment.id}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete assignment')
      }

      toast.success('Assignment deleted successfully')
      setDeletingAssignment(null)
      fetchAssignments()
      fetchCourse()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete assignment')
    }
  }

  /**
   * Toggle module publish status
   */
  const toggleModulePublish = async (module: Module) => {
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/modules/${module.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !module.isPublished }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update module')
      }

      toast.success(module.isPublished ? 'Module unpublished' : 'Module published')
      fetchModules()
    } catch (err) {
      toast.error('Failed to update module')
    }
  }

  /**
   * Toggle content publish status
   */
  const toggleContentPublish = async (item: Content) => {
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/content/${item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !item.isPublished }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update content')
      }

      toast.success(item.isPublished ? 'Content unpublished' : 'Content published')
      fetchContent()
    } catch (err) {
      toast.error('Failed to update content')
    }
  }

  /**
   * Toggle assignment publish status
   */
  const toggleAssignmentPublish = async (assignment: Assignment) => {
    try {
      const response = await fetch(
        `/api/admin/courses/${courseId}/assignments/${assignment.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !assignment.isPublished }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update assignment')
      }

      toast.success(assignment.isPublished ? 'Assignment unpublished' : 'Assignment published')
      fetchAssignments()
    } catch (err) {
      toast.error('Failed to update assignment')
    }
  }

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            href="/admin/courses"
            className="text-purple-400 hover:text-purple-300"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  // Not found
  if (!course) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Course not found</p>
          <Link
            href="/admin/courses"
            className="text-purple-400 hover:text-purple-300"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: typeof BookOpen }[] = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'modules', label: 'Modules', icon: BookOpen },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  ]

  return (
    <div className="min-h-screen bg-bg-main">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Courses', href: '/admin/courses' },
            { label: course.title },
          ]}
        />

        {/* Back link */}
        <Link
          href="/admin/courses"
          className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>

        {/* Course header */}
        <div className="mt-4 bg-card-bg rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">{course.title}</h1>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    course.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {course.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-1 text-text-secondary">
                {course.code} • {course.semester} {course.year}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Instructor: {course.instructor.name} {course.instructor.surname} (
                {course.instructor.email})
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <div className="text-center">
                <div className="font-semibold text-text-primary">
                  {course._count.enrollments}
                </div>
                <div>Students</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-text-primary">
                  {course._count.modules}
                </div>
                <div>Modules</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-text-primary">
                  {course._count.course_content}
                </div>
                <div>Content</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-text-primary">
                  {course._count.assignments}
                </div>
                <div>Assignments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="border-b border-border-color">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="bg-card-bg rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Course Details</h3>
                {course.description ? (
                  <p className="text-text-secondary">{course.description}</p>
                ) : (
                  <p className="text-text-secondary/50 italic">No description</p>
                )}
              </div>
            )}

            {/* Modules Tab */}
            {activeTab === 'modules' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-text-primary">Modules ({modules.length})</h3>
                  <button
                    onClick={() => {
                      setEditingModule(null)
                      setShowModuleModal(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Module
                  </button>
                </div>

                {modules.length === 0 ? (
                  <div className="bg-card-bg rounded-lg shadow-sm p-12 text-center text-text-secondary">
                    No modules yet. Create your first module to organize course content.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="bg-card-bg rounded-lg shadow-sm p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical className="h-5 w-5 text-text-secondary" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-text-primary">{module.title}</span>
                              {!module.isPublished && (
                                <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                                  Draft
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {module.contentCount} content • {module.assignmentCount} assignments
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleModulePublish(module)}
                            className={`p-2 rounded-md ${
                              module.isPublished
                                ? 'text-green-400 hover:bg-green-500/20'
                                : 'text-text-secondary hover:bg-bg-content'
                            }`}
                            title={module.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {module.isPublished ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingModule(module)
                              setShowModuleModal(true)
                            }}
                            className="p-2 text-text-secondary hover:text-blue-400 hover:bg-blue-500/20 rounded-md"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingModule(module)}
                            className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/20 rounded-md"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-text-primary">Content ({content.length})</h3>
                  <button
                    onClick={() => {
                      setEditingContent(null)
                      setShowContentModal(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Content
                  </button>
                </div>

                {content.length === 0 ? (
                  <div className="bg-card-bg rounded-lg shadow-sm p-12 text-center text-text-secondary">
                    No content yet. Add content items to your course modules.
                  </div>
                ) : (
                  <div className="bg-card-bg rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-border-color">
                      <thead className="bg-bg-content">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Module
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-color">
                        {content.map((item) => (
                          <tr key={item.id} className="hover:bg-bg-content">
                            <td className="px-6 py-4 font-medium text-text-primary">
                              {item.title}
                            </td>
                            <td className="px-6 py-4 text-text-secondary">{item.type}</td>
                            <td className="px-6 py-4 text-text-secondary">
                              {item.module?.title || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  item.isPublished
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {item.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleContentPublish(item)}
                                  className={`p-2 rounded-md ${
                                    item.isPublished
                                      ? 'text-green-400 hover:bg-green-500/20'
                                      : 'text-text-secondary hover:bg-bg-content'
                                  }`}
                                >
                                  {item.isPublished ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingContent(item)
                                    setShowContentModal(true)
                                  }}
                                  className="p-2 text-text-secondary hover:text-blue-400 hover:bg-blue-500/20 rounded-md"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingContent(item)}
                                  className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/20 rounded-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-text-primary">
                    Assignments ({assignments.length})
                  </h3>
                  <button
                    onClick={() => {
                      setEditingAssignment(null)
                      setShowAssignmentModal(true)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Assignment
                  </button>
                </div>

                {assignments.length === 0 ? (
                  <div className="bg-card-bg rounded-lg shadow-sm p-12 text-center text-text-secondary">
                    No assignments yet. Create assignments for students to complete.
                  </div>
                ) : (
                  <div className="bg-card-bg rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-border-color">
                      <thead className="bg-bg-content">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Module
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Points
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Submissions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-color">
                        {assignments.map((assignment) => (
                          <tr key={assignment.id} className="hover:bg-bg-content">
                            <td className="px-6 py-4 font-medium text-text-primary">
                              {assignment.title}
                            </td>
                            <td className="px-6 py-4 text-text-secondary">
                              {assignment.module?.title || '-'}
                            </td>
                            <td className="px-6 py-4 text-text-secondary">
                              {assignment.dueDate
                                ? new Date(assignment.dueDate).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="px-6 py-4 text-text-secondary">
                              {assignment.maxPoints}
                            </td>
                            <td className="px-6 py-4 text-text-secondary">
                              {assignment.submissionCount}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  assignment.isPublished
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {assignment.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleAssignmentPublish(assignment)}
                                  className={`p-2 rounded-md ${
                                    assignment.isPublished
                                      ? 'text-green-400 hover:bg-green-500/20'
                                      : 'text-text-secondary hover:bg-bg-content'
                                  }`}
                                >
                                  {assignment.isPublished ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingAssignment(assignment)
                                    setShowAssignmentModal(true)
                                  }}
                                  className="p-2 text-text-secondary hover:text-blue-400 hover:bg-blue-500/20 rounded-md"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingAssignment(assignment)}
                                  className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/20 rounded-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Modal */}
      <ModuleModal
        isOpen={showModuleModal}
        module={editingModule}
        onClose={() => {
          setShowModuleModal(false)
          setEditingModule(null)
        }}
        onSuccess={() => {
          setShowModuleModal(false)
          setEditingModule(null)
          fetchModules()
          fetchCourse()
          toast.success(editingModule ? 'Module updated' : 'Module created')
        }}
        courseId={courseId}
      />

      {/* Content Modal */}
      <ContentModal
        isOpen={showContentModal}
        content={editingContent}
        modules={modules}
        onClose={() => {
          setShowContentModal(false)
          setEditingContent(null)
        }}
        onSuccess={() => {
          setShowContentModal(false)
          setEditingContent(null)
          fetchContent()
          fetchCourse()
          toast.success(editingContent ? 'Content updated' : 'Content created')
        }}
        courseId={courseId}
      />

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        assignment={editingAssignment}
        modules={modules}
        onClose={() => {
          setShowAssignmentModal(false)
          setEditingAssignment(null)
        }}
        onSuccess={() => {
          setShowAssignmentModal(false)
          setEditingAssignment(null)
          fetchAssignments()
          fetchCourse()
          toast.success(editingAssignment ? 'Assignment updated' : 'Assignment created')
        }}
        courseId={courseId}
      />

      {/* Delete Confirmations */}
      <DeleteConfirmation
        isOpen={!!deletingModule}
        title="Delete Module"
        message={`Are you sure you want to delete "${deletingModule?.title}"? This will also delete all content and assignments in this module.`}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleDeleteModule}
      />

      <DeleteConfirmation
        isOpen={!!deletingContent}
        title="Delete Content"
        message={`Are you sure you want to delete "${deletingContent?.title}"?`}
        onClose={() => setDeletingContent(null)}
        onConfirm={handleDeleteContent}
      />

      <DeleteConfirmation
        isOpen={!!deletingAssignment}
        title="Delete Assignment"
        message={`Are you sure you want to delete "${deletingAssignment?.title}"? This will also archive all related grades.`}
        onClose={() => setDeletingAssignment(null)}
        onConfirm={handleDeleteAssignment}
      />
    </div>
  )
}

// ============================================
// Module Modal
// ============================================

function ModuleModal({
  isOpen,
  module,
  onClose,
  onSuccess,
  courseId,
}: {
  isOpen: boolean
  module: Module | null
  onClose: () => void
  onSuccess: () => void
  courseId: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiresPrevious: true,
  })

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        description: module.description || '',
        requiresPrevious: module.requiresPrevious,
      })
    } else {
      setFormData({ title: '', description: '', requiresPrevious: true })
    }
  }, [module, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = module
        ? `/api/admin/courses/${courseId}/modules/${module.id}`
        : `/api/admin/courses/${courseId}/modules`
      const method = module ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to save module')
      }

      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save module')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card-bg rounded-lg p-6 max-w-lg w-full mx-4 border border-border-color">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {module ? 'Edit Module' : 'Create Module'}
          </h3>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-content rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresPrevious"
              checked={formData.requiresPrevious}
              onChange={(e) =>
                setFormData((p) => ({ ...p, requiresPrevious: e.target.checked }))
              }
              className="h-4 w-4 text-purple-600 rounded bg-bg-content border-border-color"
            />
            <label htmlFor="requiresPrevious" className="ml-2 text-sm text-text-primary">
              Requires previous module completion
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-primary bg-bg-content border border-border-color rounded-md hover:bg-bg-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : module ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// Content Modal
// ============================================

function ContentModal({
  isOpen,
  content,
  modules,
  onClose,
  onSuccess,
  courseId,
}: {
  isOpen: boolean
  content: Content | null
  modules: Module[]
  onClose: () => void
  onSuccess: () => void
  courseId: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'TEXT',
    content: '',
    moduleId: '',
    isPublished: false,
  })

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title,
        type: content.type,
        content: '',
        moduleId: content.moduleId || '',
        isPublished: content.isPublished,
      })
    } else {
      setFormData({
        title: '',
        type: 'TEXT',
        content: '',
        moduleId: modules[0]?.id || '',
        isPublished: false,
      })
    }
  }, [content, modules, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = content
        ? `/api/admin/courses/${courseId}/content/${content.id}`
        : `/api/admin/courses/${courseId}/content`
      const method = content ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        moduleId: formData.moduleId || null,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to save content')
      }

      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save content')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card-bg rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-border-color">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {content ? 'Edit Content' : 'Create Content'}
          </h3>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-content rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="TEXT">Text</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Document</option>
              <option value="LINK">Link</option>
              <option value="YOUTUBE">YouTube</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Module
            </label>
            <select
              value={formData.moduleId}
              onChange={(e) => setFormData((p) => ({ ...p, moduleId: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">No module (standalone)</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {!content && formData.type === 'TEXT' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Content
              </label>
              <textarea
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="contentPublished"
              checked={formData.isPublished}
              onChange={(e) =>
                setFormData((p) => ({ ...p, isPublished: e.target.checked }))
              }
              className="h-4 w-4 text-purple-600 rounded bg-bg-content border-border-color"
            />
            <label htmlFor="contentPublished" className="ml-2 text-sm text-text-primary">
              Published
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-primary bg-bg-content border border-border-color rounded-md hover:bg-bg-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : content ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// Assignment Modal
// ============================================

function AssignmentModal({
  isOpen,
  assignment,
  modules,
  onClose,
  onSuccess,
  courseId,
}: {
  isOpen: boolean
  assignment: Assignment | null
  modules: Module[]
  onClose: () => void
  onSuccess: () => void
  courseId: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 100,
    moduleId: '',
    isPublished: false,
  })

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title,
        description: assignment.description || '',
        dueDate: assignment.dueDate
          ? new Date(assignment.dueDate).toISOString().slice(0, 16)
          : '',
        maxPoints: assignment.maxPoints,
        moduleId: assignment.moduleId || '',
        isPublished: assignment.isPublished,
      })
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        maxPoints: 100,
        moduleId: modules[0]?.id || '',
        isPublished: false,
      })
    }
  }, [assignment, modules, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = assignment
        ? `/api/admin/courses/${courseId}/assignments/${assignment.id}`
        : `/api/admin/courses/${courseId}/assignments`
      const method = assignment ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        moduleId: formData.moduleId || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to save assignment')
      }

      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card-bg rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-border-color">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            {assignment ? 'Edit Assignment' : 'Create Assignment'}
          </h3>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-content rounded-md">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Module
            </label>
            <select
              value={formData.moduleId}
              onChange={(e) => setFormData((p) => ({ ...p, moduleId: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">No module (standalone)</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Max Points *
              </label>
              <input
                type="number"
                required
                min={0}
                max={1000}
                value={formData.maxPoints}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, maxPoints: parseInt(e.target.value) }))
                }
                className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="assignmentPublished"
              checked={formData.isPublished}
              onChange={(e) =>
                setFormData((p) => ({ ...p, isPublished: e.target.checked }))
              }
              className="h-4 w-4 text-purple-600 rounded bg-bg-content border-border-color"
            />
            <label htmlFor="assignmentPublished" className="ml-2 text-sm text-text-primary">
              Published
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-primary bg-bg-content border border-border-color rounded-md hover:bg-bg-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : assignment ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// Delete Confirmation
// ============================================

function DeleteConfirmation({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  title: string
  message: string
  onClose: () => void
  onConfirm: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card-bg rounded-lg p-6 max-w-md w-full mx-4 border border-border-color">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-text-primary bg-bg-content border border-border-color rounded-md hover:bg-bg-main"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
