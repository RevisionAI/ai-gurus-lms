'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Save, ArrowLeft, User, Calendar, FileText } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  maxPoints: number
  course: {
    title: string
    code: string
  }
}

interface Submission {
  id: string
  content: string | null
  submittedAt: string
  student: {
    id: string
    name: string
    email: string
  }
}

interface Grade {
  id: string
  points: number
  feedback: string | null
}

export default function GradeSubmissionPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [grade, setGrade] = useState<Grade | null>(null)
  const [formData, setFormData] = useState({
    points: '',
    feedback: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentRes, submissionRes, gradeRes] = await Promise.all([
          fetch(`/api/instructor/assignments/${params.id}`),
          fetch(`/api/instructor/assignments/${params.id}/submissions/${params.submissionId}`),
          fetch(`/api/instructor/assignments/${params.id}/submissions/${params.submissionId}/grade`)
        ])

        if (assignmentRes.ok) {
          const assignmentData = await assignmentRes.json()
          setAssignment(assignmentData)
        }

        if (submissionRes.ok) {
          const submissionData = await submissionRes.json()
          setSubmission(submissionData)
        }

        if (gradeRes.ok) {
          const gradeData = await gradeRes.json()
          setGrade(gradeData)
          setFormData({
            points: gradeData.points.toString(),
            feedback: gradeData.feedback || ''
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id && params.submissionId) {
      fetchData()
    }
  }, [params.id, params.submissionId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const points = parseFloat(formData.points)
    if (isNaN(points) || points < 0 || (assignment && points > assignment.maxPoints)) {
      setError(`Points must be between 0 and ${assignment?.maxPoints}`)
      setIsLoading(false)
      return
    }

    try {
      const url = grade 
        ? `/api/instructor/assignments/${params.id}/submissions/${params.submissionId}/grade`
        : `/api/instructor/assignments/${params.id}/submissions/${params.submissionId}/grade`
      
      const method = grade ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points,
          feedback: formData.feedback
        }),
      })

      if (response.ok) {
        router.push(`/instructor/assignments/${params.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save grade')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
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

  if (!assignment || !submission) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Submission not found</h1>
              <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-500">
                Go Back
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
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Assignment
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Grade Submission</h1>
            <p className="text-sm text-gray-500">{assignment.course.code} - {assignment.course.title}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Submission Details */}
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Assignment</dt>
                      <dd className="text-sm font-medium text-gray-900">{assignment.title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Maximum Points</dt>
                      <dd className="text-sm font-medium text-gray-900">{assignment.maxPoints}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{submission.student.name}</h4>
                      <p className="text-sm text-gray-500">{submission.student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Submission</h3>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div className="flex-1">
                        {submission.content ? (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {submission.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No content submitted.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grading Form */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {grade ? 'Update Grade' : 'Assign Grade'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                      Points (out of {assignment.maxPoints}) *
                    </label>
                    <input
                      type="number"
                      name="points"
                      id="points"
                      required
                      min="0"
                      max={assignment.maxPoints}
                      step="0.1"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter points earned"
                      value={formData.points}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                      Feedback (Optional)
                    </label>
                    <textarea
                      name="feedback"
                      id="feedback"
                      rows={6}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Provide feedback to the student..."
                      value={formData.feedback}
                      onChange={handleChange}
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !formData.points}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Saving...' : grade ? 'Update Grade' : 'Save Grade'}
                    </button>
                  </div>
                </form>

                {grade && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Current Grade</h4>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Score:</span>
                        <span className="text-sm font-medium text-blue-900">
                          {grade.points}/{assignment.maxPoints} ({Math.round((grade.points / assignment.maxPoints) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}