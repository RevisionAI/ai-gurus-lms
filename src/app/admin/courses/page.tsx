/**
 * Admin Course Management Page
 *
 * Main page for managing courses in the admin dashboard.
 * Features:
 * - Course list with filtering and pagination
 * - Create, edit, and delete courses
 * - View course details and manage content
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Plus,
  RefreshCw,
  BookOpen,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Breadcrumb from '@/components/Breadcrumb'

// ============================================
// Types
// ============================================

interface Instructor {
  id: string
  name: string
  surname: string
  email: string
}

interface Course {
  id: string
  title: string
  code: string
  description: string | null
  semester: string
  year: number
  isActive: boolean
  instructor: Instructor
  _count: {
    enrollments: number
    assignments: number
    modules: number
    course_content: number
  }
  createdAt: string
  updatedAt: string
}

interface CoursesResponse {
  data: Course[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

interface FilterState {
  search: string
  isActive: string
  instructorId: string
}

// ============================================
// Component
// ============================================

export default function AdminCoursesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Data state
  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    isActive: '',
    instructorId: '',
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)

  /**
   * Fetch instructors for filter dropdown
   */
  const fetchInstructors = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?role=INSTRUCTOR&limit=100')
      const data = await response.json()
      if (response.ok) {
        setInstructors(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch instructors:', err)
    }
  }, [])

  /**
   * Fetch courses from API
   */
  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', meta.pageSize.toString())

      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.isActive) {
        params.append('isActive', filters.isActive)
      }
      if (filters.instructorId) {
        params.append('instructorId', filters.instructorId)
      }

      const response = await fetch(`/api/admin/courses?${params.toString()}`)
      const data: CoursesResponse = await response.json()

      if (!response.ok) {
        throw new Error((data as unknown as { error?: { message?: string } }).error?.message || 'Failed to fetch courses')
      }

      setCourses(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast.error('Failed to load courses')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, meta.pageSize, filters])

  // Check authentication on mount
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

  // Fetch data when dependencies change
  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchCourses()
      fetchInstructors()
    }
  }, [fetchCourses, fetchInstructors, session])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.search, filters.isActive, filters.instructorId])

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  /**
   * Handle clear filters
   */
  const handleClearFilters = useCallback(() => {
    setFilters({ search: '', isActive: '', instructorId: '' })
  }, [])

  /**
   * Handle delete course
   */
  const handleDeleteCourse = useCallback(async () => {
    if (!deletingCourse) return

    try {
      const response = await fetch(`/api/admin/courses/${deletingCourse.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete course')
      }

      toast.success('Course archived successfully')
      setDeletingCourse(null)
      fetchCourses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }, [deletingCourse, fetchCourses])

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    fetchCourses()
    toast.success('Courses refreshed')
  }, [fetchCourses])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Not authenticated
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const hasActiveFilters = filters.search || filters.isActive || filters.instructorId

  return (
    <div className="min-h-screen bg-bg-main">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Course Management' },
          ]}
        />

        {/* Page header */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Course Management
              </h1>
              <p className="text-sm text-text-secondary">
                Manage all courses, modules, content, and assignments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-content rounded-md transition-colors"
              title="Refresh courses"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-md text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mt-6 bg-card-bg p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by title, code, or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-content border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Status filter */}
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Instructor filter */}
            <select
              value={filters.instructorId}
              onChange={(e) => handleFilterChange('instructorId', e.target.value)}
              className="px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500 min-w-[200px]"
            >
              <option value="">All Instructors</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name} {instructor.surname}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-content rounded-md transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Course table */}
        <div className="mt-4 bg-card-bg rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-bg-content">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card-bg divide-y divide-border-color">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                      No courses found
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.id} className="hover:bg-bg-content transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-text-primary">
                            {course.title}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {course.code} • {course.semester} {course.year}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-primary">
                          {course.instructor.name} {course.instructor.surname}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {course.instructor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            course.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <span className="flex items-center gap-1" title="Enrollments">
                            <Users className="h-4 w-4" />
                            {course._count.enrollments}
                          </span>
                          <span className="flex items-center gap-1" title="Modules">
                            <BookOpen className="h-4 w-4" />
                            {course._count.modules}
                          </span>
                          <span className="flex items-center gap-1" title="Content">
                            <FileText className="h-4 w-4" />
                            {course._count.course_content}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="p-2 text-text-secondary hover:text-purple-400 hover:bg-purple-500/20 rounded-md transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditingCourse(course)}
                            className="p-2 text-text-secondary hover:text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"
                            title="Edit course"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCourse(course)}
                            className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                            title="Delete course"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border-color flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Showing {(meta.page - 1) * meta.pageSize + 1} to{' '}
                {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} courses
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-content rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-text-secondary">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={currentPage === meta.totalPages || isLoading}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-content rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchCourses()
          toast.success('Course created successfully')
        }}
        instructors={instructors}
      />

      {/* Edit Modal */}
      <CourseModal
        isOpen={!!editingCourse}
        course={editingCourse}
        onClose={() => setEditingCourse(null)}
        onSuccess={() => {
          setEditingCourse(null)
          fetchCourses()
          toast.success('Course updated successfully')
        }}
        instructors={instructors}
      />

      {/* Delete Confirmation */}
      {deletingCourse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-6 max-w-md w-full mx-4 border border-border-color">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Delete Course
            </h3>
            <p className="text-text-secondary mb-4">
              Are you sure you want to delete &quot;{deletingCourse.title}&quot;? This will
              also archive all modules, content, and assignments. This action can
              be undone from the Deleted Records page.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 text-text-primary bg-bg-content rounded-md hover:bg-bg-main border border-border-color"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Course Modal Component
// ============================================

interface CourseModalProps {
  isOpen: boolean
  course?: Course | null
  onClose: () => void
  onSuccess: () => void
  instructors: Instructor[]
}

function CourseModal({ isOpen, course, onClose, onSuccess, instructors }: CourseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    isActive: true,
    instructorId: '',
  })

  // Reset form when modal opens/closes or course changes
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        code: course.code,
        description: course.description || '',
        semester: course.semester,
        year: course.year,
        isActive: course.isActive,
        instructorId: course.instructor.id,
      })
    } else {
      setFormData({
        title: '',
        code: '',
        description: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        isActive: true,
        instructorId: instructors[0]?.id || '',
      })
    }
  }, [course, instructors, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = course
        ? `/api/admin/courses/${course.id}`
        : '/api/admin/courses'
      const method = course ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save course')
      }

      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save course')
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
            {course ? 'Edit Course' : 'Create Course'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-content rounded-md"
          >
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
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-purple-500 focus:border-purple-500"
              placeholder="Introduction to Computer Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Course Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-purple-500 focus:border-purple-500"
              placeholder="CS-101"
              pattern="[A-Z]{2,6}-?\d{2,4}"
              title="Format: XX-123 or XXXX1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Instructor *
            </label>
            <select
              required
              value={formData.instructorId}
              onChange={(e) => setFormData((p) => ({ ...p, instructorId: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select an instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name} {instructor.surname} ({instructor.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Semester *
              </label>
              <select
                required
                value={formData.semester}
                onChange={(e) => setFormData((p) => ({ ...p, semester: e.target.value }))}
                className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Year *
              </label>
              <input
                type="number"
                required
                min={2020}
                max={2100}
                value={formData.year}
                onChange={(e) => setFormData((p) => ({ ...p, year: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-content border border-border-color rounded-md text-text-primary placeholder-text-secondary focus:ring-purple-500 focus:border-purple-500"
              placeholder="Course description..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-border-color rounded bg-bg-content"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-text-primary">
              Course is active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-text-primary bg-bg-content border border-border-color rounded-md hover:bg-bg-main disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
