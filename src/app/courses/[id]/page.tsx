'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import StudentModuleList from '@/components/modules/StudentModuleList'
import { BookOpen, ClipboardList, MessageSquare, Clock, Calendar, Layers, ArrowLeft, FileText, Video, File, Link as LinkIcon } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  code: string
  semester: string
  year: number
  instructor: {
    name: string
  }
  prerequisites: string | null
  learningObjectives: string[]
  targetAudience: string | null
}

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxPoints: number
  isPublished: boolean
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  author: {
    name: string
  }
}

interface CourseContent {
  id: string
  title: string
  type: 'TEXT' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'SCORM' | 'YOUTUBE'
  content: string | null
  fileUrl: string | null
  thumbnailUrl: string | null
  orderIndex: number
  createdAt: string
}

export default function StudentCourseDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [course, setCourse] = useState<Course | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [content, setContent] = useState<CourseContent[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [courseRes, assignmentsRes, announcementsRes, contentRes] = await Promise.all([
          fetch(`/api/student/courses/${params.id}`),
          fetch(`/api/student/courses/${params.id}/assignments`),
          fetch(`/api/student/courses/${params.id}/announcements`),
          fetch(`/api/student/courses/${params.id}/content`)
        ])

        if (courseRes.ok) {
          const courseData = await courseRes.json()
          setCourse(courseData)
        }

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json()
          setAssignments(assignmentsData)
        }

        if (announcementsRes.ok) {
          const announcementsData = await announcementsRes.json()
          setAnnouncements(announcementsData)
        }

        if (contentRes.ok) {
          const contentData = await contentRes.json()
          setContent(contentData)
        }
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id && session?.user.role === 'STUDENT') {
      fetchCourseData()
    }
  }, [params.id, session])

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!course) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
              <Link href="/courses" className="text-blue-600 hover:text-blue-500">
                Back to Courses
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const upcomingAssignments = assignments.filter(a => 
    a.dueDate && new Date(a.dueDate) > new Date()
  ).slice(0, 3)

  const getContentIcon = (type: CourseContent['type']) => {
    switch (type) {
      case 'TEXT': return FileText
      case 'VIDEO': return Video
      case 'YOUTUBE': return Video
      case 'DOCUMENT': return File
      case 'LINK': return LinkIcon
      case 'SCORM': return BookOpen
      default: return FileText
    }
  }

  const getContentIconColor = (type: CourseContent['type']) => {
    switch (type) {
      case 'TEXT': return 'text-white bg-gray-500'
      case 'VIDEO': return 'text-white bg-red-500'
      case 'YOUTUBE': return 'text-white bg-red-600'
      case 'DOCUMENT': return 'text-white bg-green-500'
      case 'LINK': return 'text-white bg-purple-500'
      case 'SCORM': return 'text-white bg-blue-500'
      default: return 'text-white bg-gray-500'
    }
  }

  // Extract YouTube video ID from URL for embedding
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BookOpen },
    { id: 'modules', name: 'Modules', icon: Layers },
    { id: 'discussions', name: 'Discussions', icon: MessageSquare },
    { id: 'announcements', name: 'Announcements', icon: Calendar }
  ]

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb 
            items={generateBreadcrumbs.studentCourse(
              params.id as string, 
              course?.title
            )} 
          />
          {/* Course Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Back to Dashboard
                    </Link>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                  <p className="text-sm text-gray-500">{course.code} • {course.semester} {course.year}</p>
                  <p className="text-sm text-gray-600 mt-1">Instructor: {course.instructor.name}</p>
                  {course.description && (
                    <p className="mt-2 text-gray-600">{course.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prerequisites Section */}
          {course.prerequisites && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Prerequisites</h3>
                  <div className="mt-2 text-sm text-blue-700 whitespace-pre-wrap">
                    {course.prerequisites}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Learning Objectives Section */}
          {course.learningObjectives && course.learningObjectives.length > 0 && (
            <div className="bg-white shadow rounded-lg mb-6 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">What You&apos;ll Learn</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {course.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Target Audience Section */}
          {course.targetAudience && (
            <div className="bg-white shadow rounded-lg mb-6 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Who Should Take This Course?</h3>
              <p className="text-gray-700">{course.targetAudience}</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Content Items</dt>
                      <dd className="text-lg font-medium text-gray-900">{content.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardList className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Assignments</dt>
                      <dd className="text-lg font-medium text-gray-900">{assignments.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Due</dt>
                      <dd className="text-lg font-medium text-gray-900">{upcomingAssignments.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Announcements</dt>
                      <dd className="text-lg font-medium text-gray-900">{announcements.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-white bg-blue-600'
                          : 'border-transparent text-white bg-gray-600 hover:bg-gray-500'
                      } whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm flex items-center rounded-t-md`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Assignments</h3>
                      {upcomingAssignments.length === 0 ? (
                        <p className="text-gray-500">No upcoming assignments.</p>
                      ) : (
                        <div className="space-y-3">
                          {upcomingAssignments.map((assignment) => (
                            <Link
                              key={assignment.id}
                              href={`/courses/${course.id}/assignments/${assignment.id}`}
                              className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                                  <p className="text-sm text-gray-500">
                                    Max Points: {assignment.maxPoints}
                                  </p>
                                  {assignment.dueDate && (
                                    <p className="text-sm text-red-600">
                                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setActiveTab('modules')}
                          className="block w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <Layers className="h-5 w-5 text-indigo-600 mr-3" />
                            <span className="font-medium">Browse Modules</span>
                          </div>
                        </button>
                        <Link
                          href={`/courses/${course.id}/discussions`}
                          className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <MessageSquare className="h-5 w-5 text-green-600 mr-3" />
                            <span className="font-medium">Join Discussions</span>
                          </div>
                        </Link>
                        <Link
                          href={`/courses/${course.id}/announcements`}
                          className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                            <span className="font-medium">View Announcements</span>
                          </div>
                        </Link>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Recent Announcements</h3>
                      {announcements.length === 0 ? (
                        <p className="text-gray-500">No announcements yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {announcements.slice(0, 3).map((announcement) => (
                            <div
                              key={announcement.id}
                              className="p-3 border border-gray-200 rounded-lg"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(announcement.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'modules' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Course Modules</h3>
                  <StudentModuleList courseId={course.id} />
                </div>
              )}

              {activeTab === 'discussions' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Course Discussions</h3>
                    <Link
                      href={`/courses/${course.id}/discussions`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      View All Discussions
                    </Link>
                  </div>
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Discussions</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Join the conversation with your classmates and instructor.
                    </p>
                    <div className="mt-6">
                      <Link
                        href={`/courses/${course.id}/discussions`}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Browse Discussions
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'announcements' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Course Announcements</h3>
                    <Link
                      href={`/courses/${course.id}/announcements`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      View All Announcements
                    </Link>
                  </div>
                  {announcements.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Your instructor hasn't posted any announcements for this course.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.slice(0, 3).map((announcement) => (
                        <div
                          key={announcement.id}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                            <span className="text-sm text-gray-500">
                              {new Date(announcement.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-600 whitespace-pre-wrap line-clamp-3">{announcement.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Posted by {announcement.author.name}
                          </p>
                        </div>
                      ))}
                      {announcements.length > 3 && (
                        <div className="text-center pt-2">
                          <Link
                            href={`/courses/${course.id}/announcements`}
                            className="text-sm text-purple-600 hover:text-purple-500"
                          >
                            View all {announcements.length} announcements
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}