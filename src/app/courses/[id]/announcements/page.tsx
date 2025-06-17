'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import { ArrowLeft, Calendar, User, MessageSquare } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  author: {
    name: string | null
  }
}

interface Course {
  id: string
  title: string
  code: string
}

export default function StudentAnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
  const [courseId, setCourseId] = useState<string>('')
  const [course, setCourse] = useState<Course | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      const loadData = async () => {
        setLoading(true)
        setError(null)
        
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          setLoading(false)
          setError('Loading timed out. Please try again.')
        }, 10000) // 10 second timeout
        
        try {
          await Promise.all([fetchCourse(), fetchAnnouncements()])
          clearTimeout(timeout)
        } catch (error) {
          clearTimeout(timeout)
          console.error('Error loading announcement page data:', error)
          setError('Failed to load announcements. Please try again.')
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [courseId])

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.push(`/courses/${courseId}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/student/courses/${courseId}`)
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
      const response = await fetch(`/api/student/courses/${courseId}/announcements`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      } else {
        console.error('Failed to fetch announcements')
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
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
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb 
            items={generateBreadcrumbs.studentCourseSection(
              courseId, 
              course?.title, 
              'Announcements'
            )} 
          />

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <Link
                  href={`/courses/${courseId}`}
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
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading announcements...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your instructor hasn't posted any announcements for this course.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <article key={announcement.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <header className="mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {announcement.title}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>{announcement.author.name || 'Instructor'}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(announcement.createdAt)}</span>
                        </div>
                      </div>
                    </header>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <div className="whitespace-pre-wrap">
                        {announcement.content}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}