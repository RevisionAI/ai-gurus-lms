'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import { ArrowLeft } from 'lucide-react'

interface Discussion {
  id: string
  title: string
  description: string | null
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    posts: number
  }
}

interface Course {
  id: string
  title: string
  code: string
}

export default function InstructorDiscussionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [courseId, setCourseId] = useState<string>('')
  const [course, setCourse] = useState<Course | null>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPinned: false
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
      fetchDiscussions()
    }
  }, [courseId])

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

  const fetchDiscussions = async () => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/discussions`)
      if (response.ok) {
        const data = await response.json()
        setDiscussions(data)
      } else {
        console.error('Failed to fetch discussions')
      }
    } catch (error) {
      console.error('Error fetching discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a title for the discussion.')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newDiscussion = await response.json()
        setDiscussions([newDiscussion, ...discussions])
        setFormData({ title: '', description: '', isPinned: false })
        setShowCreateForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create discussion')
      }
    } catch (error) {
      console.error('Error creating discussion:', error)
      alert('An error occurred while creating the discussion')
    } finally {
      setCreating(false)
    }
  }

  const handleTogglePin = async (discussionId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/discussions/${discussionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: !isPinned }),
      })

      if (response.ok) {
        const updatedDiscussion = await response.json()
        setDiscussions(discussions.map(d => 
          d.id === discussionId ? { ...d, isPinned: updatedDiscussion.isPinned } : d
        ))
      } else {
        alert('Failed to update discussion')
      }
    } catch (error) {
      console.error('Error updating discussion:', error)
      alert('An error occurred while updating the discussion')
    }
  }

  const handleToggleLock = async (discussionId: string, isLocked: boolean) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/discussions/${discussionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLocked: !isLocked }),
      })

      if (response.ok) {
        const updatedDiscussion = await response.json()
        setDiscussions(discussions.map(d => 
          d.id === discussionId ? { ...d, isLocked: updatedDiscussion.isLocked } : d
        ))
      } else {
        alert('Failed to update discussion')
      }
    } catch (error) {
      console.error('Error updating discussion:', error)
      alert('An error occurred while updating the discussion')
    }
  }

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/discussions/${discussionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDiscussions(discussions.filter(d => d.id !== discussionId))
      } else {
        alert('Failed to delete discussion')
      }
    } catch (error) {
      console.error('Error deleting discussion:', error)
      alert('An error occurred while deleting the discussion')
    }
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
            items={generateBreadcrumbs.instructorDiscussion(
              courseId, 
              course?.title
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
                  <h1 className="text-2xl font-bold text-gray-900">Discussions</h1>
                  {course && (
                    <p className="text-gray-600 mt-1">{course.title} ({course.code})</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Discussion
              </button>
            </div>

            {showCreateForm && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-4">Create New Discussion</h3>
                <form onSubmit={handleCreateDiscussion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter discussion title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter discussion description"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isPinned" className="text-sm text-gray-700">
                      Pin this discussion to the top
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create Discussion'}
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
                <p className="text-gray-500">Loading discussions...</p>
              </div>
            ) : discussions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No discussions yet. Create your first discussion to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <div key={discussion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{discussion.title}</h3>
                          {discussion.isPinned && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pinned</span>
                          )}
                          {discussion.isLocked && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Locked</span>
                          )}
                        </div>
                        {discussion.description && (
                          <p className="text-gray-600 mb-2">{discussion.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created by {discussion.author.name || discussion.author.email}</span>
                          <span>{formatDate(discussion.createdAt)}</span>
                          <span>{discussion._count.posts} posts</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTogglePin(discussion.id, discussion.isPinned)}
                          className={`px-3 py-1 text-sm rounded ${
                            discussion.isPinned 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {discussion.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={() => handleToggleLock(discussion.id, discussion.isLocked)}
                          className={`px-3 py-1 text-sm rounded ${
                            discussion.isLocked 
                              ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {discussion.isLocked ? 'Unlock' : 'Lock'}
                        </button>
                        <button
                          onClick={() => router.push(`/instructor/courses/${courseId}/discussions/${discussion.id}`)}
                          className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1 text-sm rounded"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteDiscussion(discussion.id)}
                          className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 text-sm rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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