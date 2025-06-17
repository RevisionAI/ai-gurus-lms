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

export default function StudentDiscussionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [courseId, setCourseId] = useState<string>('')
  const [course, setCourse] = useState<Course | null>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
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
      const response = await fetch(`/api/student/courses/${courseId}`)
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
      const response = await fetch(`/api/student/courses/${courseId}/discussions`)
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
            items={generateBreadcrumbs.studentDiscussion(
              courseId, 
              course?.title
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
                  <h1 className="text-2xl font-bold text-gray-900">Discussions</h1>
                  {course && (
                    <p className="text-gray-600 mt-1">{course.title} ({course.code})</p>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading discussions...</p>
              </div>
            ) : discussions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No discussions available yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <div 
                    key={discussion.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/courses/${courseId}/discussions/${discussion.id}`)}
                  >
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
                          <span>Started by {discussion.author.name || discussion.author.email}</span>
                          <span>{formatDate(discussion.createdAt)}</span>
                          <span>{discussion._count.posts} posts</span>
                        </div>
                      </div>
                      <div className="text-blue-600 hover:text-blue-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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