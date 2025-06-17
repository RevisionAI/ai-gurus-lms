'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import { ArrowLeft, Plus, Edit, Trash2, Calendar, User } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
  }
}

interface Course {
  id: string
  title: string
  code: string
}

export default function InstructorAnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
  const [courseId, setCourseId] = useState<string>('')
  const [course, setCourse] = useState<Course | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setCourseId(resolvedParams.id)
    }
    fetchParams()
  }, [params])

  useEffect(() => {
    if (courseId) {
      fetchCourse()
      fetchAnnouncements()
    }
  }, [courseId])

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCreateForm || editingId) {
          setShowCreateForm(false)
          setEditingId(null)
          setFormData({ title: '', content: '' })
        } else {
          router.push(`/instructor/courses/${courseId}`)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, courseId, showCreateForm, editingId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`)
      if (response.ok) {
        const courseData = await response.json()
        setCourse(courseData)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/announcements`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      } else {
        console.error('Failed to fetch announcements')
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please enter both title and content for the announcement.')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newAnnouncement = await response.json()
        setAnnouncements([newAnnouncement, ...announcements])
        setFormData({ title: '', content: '' })
        setShowCreateForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create announcement')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert('An error occurred while creating the announcement')
    } finally {
      setCreating(false)
    }
  }

  const handleEditAnnouncement = async (announcementId: string) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please enter both title and content for the announcement.')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/announcements/${announcementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedAnnouncement = await response.json()
        setAnnouncements(announcements.map(a => 
          a.id === announcementId ? updatedAnnouncement : a
        ))
        setFormData({ title: '', content: '' })
        setEditingId(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update announcement')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      alert('An error occurred while updating the announcement')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/announcements/${announcementId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAnnouncements(announcements.filter(a => a.id !== announcementId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete announcement')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('An error occurred while deleting the announcement')
    }
  }

  const startEdit = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setFormData({
      title: announcement.title,
      content: announcement.content
    })
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: '', content: '' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!courseId) {
    return <div>Loading...</div>
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb 
            items={generateBreadcrumbs.instructorCourseSection(
              courseId, 
              course?.title, 
              'Announcements'
            )} 
          />

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <Link
                  href={`/instructor/courses/${courseId}`}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Course
                </Link>
                <div className="border-l border-gray-300 pl-4">
                  <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
                  {course && (
                    <p className="text-gray-600 mt-1">{course.title} ({course.code})</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </button>
            </div>

            {showCreateForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-4">Create New Announcement</h3>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter announcement title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Enter announcement content"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create Announcement'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first announcement to communicate with your students.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Announcement
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {editingId === announcement.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                          </label>
                          <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAnnouncement(announcement.id)}
                            disabled={creating}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {creating ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEdit(announcement)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Edit announcement"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Delete announcement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap mb-3">
                          {announcement.content}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{announcement.author.name || announcement.author.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(announcement.createdAt)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}