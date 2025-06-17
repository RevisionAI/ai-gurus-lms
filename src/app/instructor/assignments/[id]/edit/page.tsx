'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import { Save, ArrowLeft, Calendar, FileText } from 'lucide-react'
import RichTextEditor from '@/components/RichTextEditor'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxPoints: number
  isPublished: boolean
  course: {
    id: string
    title: string
    code: string
  }
}

export default function EditAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxPoints: 100,
    isPublished: false
  })


  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`/api/instructor/assignments/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setAssignment(data)
          setFormData({
            title: data.title,
            description: data.description || '',
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : '',
            maxPoints: data.maxPoints,
            isPublished: data.isPublished
          })
        } else {
          console.error('Failed to fetch assignment')
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error fetching assignment:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (params.id && session?.user.role === 'INSTRUCTOR') {
      fetchAssignment()
    }
  }, [params.id, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignment) return

    setSaving(true)
    try {
      const response = await fetch(`/api/instructor/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate || null,
          maxPoints: formData.maxPoints,
          isPublished: formData.isPublished
        }),
      })

      if (response.ok) {
        router.push(`/instructor/assignments/${assignment.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('An error occurred while updating the assignment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!assignment) return
    
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/instructor/assignments/${assignment.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push(`/instructor/courses/${assignment.course.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('An error occurred while deleting the assignment')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!assignment) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Assignment not found</h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 text-blue-600 hover:text-blue-500"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          {assignment?.course && (
            <Breadcrumb 
              items={generateBreadcrumbs.instructorAssignmentEdit(
                assignment.course.id, 
                assignment.course.title, 
                assignment.id,
                assignment.title
              )} 
            />
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Edit Assignment</h1>
                  {assignment.course && (
                    <p className="text-sm text-gray-500">
                      {assignment.course.code} - {assignment.course.title}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => router.push(`/instructor/assignments/${assignment.id}`)}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Assignment
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter assignment title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1 border border-gray-300 rounded-md overflow-hidden">
                    <RichTextEditor
                      value={formData.description}
                      onChange={(content) => setFormData({ ...formData, description: content })}
                    />
                  </div>
                </div>

                {/* Due Date and Max Points Row */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Due Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      id="dueDate"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="maxPoints" className="block text-sm font-medium text-gray-700">
                      Maximum Points
                    </label>
                    <input
                      type="number"
                      id="maxPoints"
                      required
                      min="1"
                      max="1000"
                      value={formData.maxPoints}
                      onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) || 100 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Published Status */}
                <div className="flex items-center">
                  <input
                    id="isPublished"
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                    Publish assignment (students will be able to see and submit)
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Delete Assignment
                  </button>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/instructor/assignments/${assignment.id}`)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !formData.title.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}