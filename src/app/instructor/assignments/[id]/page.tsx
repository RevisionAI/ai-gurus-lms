'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import { Users, Clock, CheckCircle, XCircle, Calendar, FileText, Edit, File } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxPoints: number
  isPublished: boolean
  createdAt: string
  course: {
    id: string
    title: string
    code: string
  }
  _count: {
    submissions: number
  }
}

interface Submission {
  id: string
  content: string | null
  fileUrl: string | null
  submittedAt: string
  student: {
    id: string
    name: string
    email: string
  }
  grade?: {
    id: string
    points: number
    feedback: string | null
    gradedAt: string
  }
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignmentData = async () => {
      try {
        const [assignmentRes, submissionsRes] = await Promise.all([
          fetch(`/api/instructor/assignments/${params.id}`),
          fetch(`/api/instructor/assignments/${params.id}/submissions`)
        ])

        if (assignmentRes.ok) {
          const assignmentData = await assignmentRes.json()
          setAssignment(assignmentData)
        }

        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json()
          setSubmissions(submissionsData)
        }
      } catch (error) {
        console.error('Error fetching assignment data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchAssignmentData()
    }
  }, [params.id])

  const togglePublished = async () => {
    if (!assignment) return

    try {
      const response = await fetch(`/api/instructor/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...assignment,
          isPublished: !assignment.isPublished
        }),
      })

      if (response.ok) {
        const updatedAssignment = await response.json()
        setAssignment(updatedAssignment)
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
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
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const gradedCount = submissions.filter(s => s.grade).length
  const pendingCount = submissions.length - gradedCount

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'submissions', name: 'Submissions', icon: Users },
    { id: 'grading', name: 'Grading', icon: CheckCircle }
  ]

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          {assignment?.course && (
            <Breadcrumb 
              items={generateBreadcrumbs.instructorAssignment(
                assignment.course.id, 
                assignment.course.title, 
                params.id as string,
                assignment.title
              )} 
            />
          )}
          {/* Assignment Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
                  {assignment.course && (
                    <p className="text-sm text-gray-500">
                      {assignment.course.code} - {assignment.course.title}
                    </p>
                  )}
                  {assignment.dueDate && (
                    <p className="text-sm text-gray-600 mt-1">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()} at {new Date(assignment.dueDate).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={togglePublished}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                      assignment.isPublished
                        ? 'text-green-700 bg-green-100 hover:bg-green-200'
                        : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                    }`}
                  >
                    {assignment.isPublished ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Published
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Draft
                      </>
                    )}
                  </button>
                  <Link
                    href={`/instructor/assignments/${assignment.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                      <dd className="text-lg font-medium text-gray-900">{submissions.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Graded</dt>
                      <dd className="text-lg font-medium text-gray-900">{gradedCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                      <dd className="text-lg font-medium text-gray-900">{pendingCount}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Max Points</dt>
                      <dd className="text-lg font-medium text-gray-900">{assignment.maxPoints}</dd>
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
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
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
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Assignment Details</h3>
                    <div className="prose max-w-none">
                      {assignment.description ? (
                        <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: assignment.description }} />
                      ) : (
                        <p className="text-gray-500 italic">No description provided.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Assignment Information</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-gray-500">Created</dt>
                          <dd className="text-sm text-gray-900">{new Date(assignment.createdAt).toLocaleDateString()}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Maximum Points</dt>
                          <dd className="text-sm text-gray-900">{assignment.maxPoints}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Status</dt>
                          <dd className="text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              assignment.isPublished 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {assignment.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Submissions</h3>
                  {submissions.length === 0 ? (
                    <p className="text-gray-500">No submissions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((submission) => (
                        <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{submission.student.name}</h4>
                              <p className="text-sm text-gray-500">{submission.student.email}</p>
                              <p className="text-sm text-gray-400">
                                Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              {submission.grade ? (
                                <div>
                                  <p className="text-lg font-medium text-green-600">
                                    {submission.grade.points}/{assignment.maxPoints}
                                  </p>
                                  <p className="text-sm text-gray-500">Graded</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                                  <Link
                                    href={`/instructor/assignments/${assignment.id}/grade/${submission.id}`}
                                    className="text-sm text-blue-600 hover:text-blue-500"
                                  >
                                    Grade Now
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                          {(submission.content || submission.fileUrl) && (
                            <div className="mt-3 space-y-3">
                              {submission.content && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-1">Text Response:</h5>
                                  <div className="p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {submission.content}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {submission.fileUrl && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-1">File Attachment:</h5>
                                  <div className="flex items-center p-2 bg-gray-50 rounded-md">
                                    <File className="h-4 w-4 text-gray-400 mr-2" />
                                    <a
                                      href={submission.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-500"
                                    >
                                      {submission.fileUrl.split('/').pop() || 'Download file'}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'grading' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Grading Overview</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900">Graded Submissions</h4>
                        <p className="text-2xl font-bold text-green-600">{gradedCount}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-900">Pending Grading</h4>
                        <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                      </div>
                    </div>
                    
                    {pendingCount > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                          {submissions.filter(s => !s.grade).map((submission) => (
                            <div key={submission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <span className="text-sm font-medium">{submission.student.name}</span>
                              <Link
                                href={`/instructor/assignments/${assignment.id}/grade/${submission.id}`}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                Grade
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}