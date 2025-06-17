'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, Edit, Trash2, Clock, User } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  courseId: string
  authorId: string
  course: {
    id: string
    title: string
    code: string
  }
  author: {
    id: string
    name: string
    email: string
  }
}

export default function AnnouncementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string
  const announcementId = params?.announcementId as string

  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchAnnouncement = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/instructor/courses/${courseId}/announcements/${announcementId}`)
        
        if (response.ok) {
          const data = await response.json()
          setAnnouncement(data)
        } else {
          const error = await response.json()
          setError(error.error || 'Failed to fetch announcement')
          toast.error(error.error || 'Failed to fetch announcement')
        }
      } catch (error) {
        console.error('Error fetching announcement:', error)
        setError('An error occurred while fetching the announcement')
        toast.error('An error occurred while fetching the announcement')
      } finally {
        setLoading(false)
      }
    }

    if (courseId && announcementId) {
      fetchAnnouncement()
    } else {
      setError('Invalid course or announcement ID')
      setLoading(false)
    }
  }, [courseId, announcementId])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/announcements/${announcementId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Announcement deleted successfully')
        router.push('/instructor/announcements')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete announcement')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('An error occurred while deleting the announcement')
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  const formatContentWithLineBreaks = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ))
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center mb-6">
              <Link href="/instructor/announcements" className="mr-4">
                <ArrowLeft className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </Link>
              <h1 className="text-2xl font-semibold text-text-primary">Announcement Details</h1>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : error ? (
              <div className="bg-card-bg rounded-lg shadow p-6">
                <div className="text-center">
                  <h3 className="mt-2 text-lg font-medium text-red-500">{error}</h3>
                  <Link
                    href="/instructor/announcements"
                    className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    Back to Announcements
                  </Link>
                </div>
              </div>
            ) : announcement ? (
              <>
                <div className="bg-card-bg rounded-lg shadow p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between mb-4 border-b border-gray-200 pb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-text-primary mb-2">{announcement.title}</h2>
                      <p className="text-text-secondary">
                        {announcement.course.code} - {announcement.course.title}
                      </p>
                    </div>
                    <div className="flex mt-4 sm:mt-0">
                      <Link
                        href={`/instructor/courses/${announcement.courseId}/announcements/${announcement.id}/edit`}
                        className="inline-flex items-center mr-4 text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-5 w-5 mr-1" />
                        Edit
                      </Link>
                      {deleteConfirm ? (
                        <div className="flex items-center">
                          <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-red-600 hover:text-red-800 font-medium mr-3"
                          >
                            {deleting ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(false)}
                            className="text-gray-600 hover:text-gray-800"
                            disabled={deleting}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(true)}
                          className="inline-flex items-center text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5 mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4 text-sm text-text-secondary">
                    <div className="flex items-center mr-4">
                      <User className="h-4 w-4 mr-1" />
                      {announcement.author.name}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Posted {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })} ({format(new Date(announcement.createdAt), 'MMM d, yyyy')})
                    </div>
                  </div>

                  <div className="prose prose-pink max-w-none text-text-primary">
                    <p className="whitespace-pre-line">{announcement.content}</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Link
                    href="/instructor/announcements"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    Back to All Announcements
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
