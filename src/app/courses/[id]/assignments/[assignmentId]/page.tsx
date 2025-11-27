'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import { Calendar, Clock, FileText, Upload, CheckCircle, Paperclip, X, File, Cloud } from 'lucide-react'
import { uploadToS3 } from '@/hooks/useS3Upload'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxPoints: number
  course: {
    id: string
    title: string
    code: string
  }
}

interface Submission {
  id: string
  content: string | null
  fileUrl: string | null
  submittedAt: string
}

interface Grade {
  id: string
  points: number
  feedback: string | null
  gradedAt: string
}

export default function StudentAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [grade, setGrade] = useState<Grade | null>(null)
  const [submissionText, setSubmissionText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<{url: string, filename: string} | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignmentData = async () => {
      try {
        const [assignmentRes, submissionRes, gradeRes] = await Promise.all([
          fetch(`/api/student/assignments/${params.assignmentId}`),
          fetch(`/api/student/assignments/${params.assignmentId}/submission`),
          fetch(`/api/student/assignments/${params.assignmentId}/grade`)
        ])

        if (assignmentRes.ok) {
          const assignmentData = await assignmentRes.json()
          setAssignment(assignmentData)
        }

        if (submissionRes.ok) {
          const submissionData = await submissionRes.json()
          setSubmission(submissionData)
          setSubmissionText(submissionData.content || '')
          if (submissionData.fileUrl) {
            // Extract filename from URL
            const filename = submissionData.fileUrl.split('/').pop() || 'file'
            setUploadedFile({ url: submissionData.fileUrl, filename })
          }
        }

        if (gradeRes.ok) {
          const gradeData = await gradeRes.json()
          setGrade(gradeData)
        }
      } catch (error) {
        console.error('Error fetching assignment data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.assignmentId && session?.user.role === 'STUDENT') {
      fetchAssignmentData()
    }
  }, [params.assignmentId, session])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError('')

    try {
      // Upload to R2 via signed URL
      const result = await uploadToS3(file, {
        directory: 'submissions',
        assignmentId: params.assignmentId,
        isPublic: false,
      })
      setUploadedFile({ url: result.cdnUrl, filename: result.filename })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while uploading the file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/student/assignments/${params.assignmentId}/submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: submissionText,
          fileUrl: uploadedFile?.url
        }),
      })

      if (response.ok) {
        const newSubmission = await response.json()
        setSubmission(newSubmission)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit assignment')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/student/assignments/${params.assignmentId}/submission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: submissionText,
          fileUrl: uploadedFile?.url
        }),
      })

      if (response.ok) {
        const updatedSubmission = await response.json()
        setSubmission(updatedSubmission)
        setSubmissionText(updatedSubmission.content || '')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update submission')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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

  if (!assignment) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Assignment not found</h1>
              <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-500">
                Go Back
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date()
  const canSubmit = !isOverdue || !submission
  const hasContent = submissionText.trim() || uploadedFile

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb 
            items={generateBreadcrumbs.studentAssignment(
              params.id as string, 
              assignment.course.title, 
              params.assignmentId as string,
              assignment.title
            )} 
          />
          {/* Assignment Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
                  <p className="text-sm text-gray-500">{assignment.course.code} - {assignment.course.title}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Max Points: {assignment.maxPoints}
                    </div>
                    {assignment.dueDate && (
                      <div className={`flex items-center text-sm ${
                        isOverdue ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        <Clock className="h-4 w-4 mr-1" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()} at {new Date(assignment.dueDate).toLocaleTimeString()}
                        {isOverdue && <span className="ml-1 font-semibold">(Overdue)</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {submission && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Submitted
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Assignment Details */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Instructions</h3>
                  <div className="prose max-w-none">
                    {assignment.description ? (
                      <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: assignment.description }} />
                    ) : (
                      <p className="text-gray-500 italic">No instructions provided.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submission Form */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {submission ? 'Update Submission' : 'Submit Assignment'}
                  </h3>
                  
                  {canSubmit ? (
                    <form onSubmit={submission ? handleUpdate : handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                          Your Response (Optional)
                        </label>
                        <textarea
                          id="content"
                          name="content"
                          rows={6}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Type your assignment response here..."
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                        />
                      </div>

                      {/* File Upload Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attach File (Optional)
                        </label>
                        
                        {uploadedFile ? (
                          <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                            <div className="flex items-center">
                              <File className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{uploadedFile.filename}</span>
                              {uploadedFile.url.includes('r2.cloudflarestorage') && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  <Cloud className="h-3 w-3 mr-1" />
                                  R2
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.mp4,.mov,.avi,.wmv,.flv,.webm,.mp3,.wav,.ogg,.aac,.zip,.rar,.7z"
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                PDF, Word, PowerPoint, Excel, text, image, video, audio, or archive files up to 50MB
                              </p>
                              {isUploading && (
                                <p className="text-xs text-blue-600">Uploading...</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmitting || isUploading || !hasContent}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isSubmitting ? 'Submitting...' : submission ? 'Update Submission' : 'Submit Assignment'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-red-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Assignment Overdue</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This assignment is past its due date and can no longer be submitted.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Submission Status */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`text-sm font-medium ${
                        submission ? 'text-green-600' : isOverdue ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {submission ? 'Submitted' : isOverdue ? 'Overdue' : 'Not Submitted'}
                      </span>
                    </div>
                    {submission && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Submitted:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Grade:</span>
                      <span className="text-sm text-gray-900">
                        {grade ? `${grade.points}/${assignment.maxPoints}` : 'Not graded'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grade Details */}
              {grade && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Details</h3>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {grade.points}/{assignment.maxPoints}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round((grade.points / assignment.maxPoints) * 100)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-gray-500">
                          Graded on {new Date(grade.gradedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {grade.feedback && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Instructor Feedback</h4>
                          <div className="p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {grade.feedback}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Current Submission */}
              {submission && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Current Submission</h3>
                    
                    {submission.content && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Text Response:</h4>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {submission.content}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {submission.fileUrl && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">File Attachment:</h4>
                        <div className="flex items-center p-3 bg-gray-50 rounded-md">
                          <File className="h-5 w-5 text-gray-400 mr-2" />
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
                    
                    {!submission.content && !submission.fileUrl && (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-500">No content or file submitted.</p>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Last updated: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                    </div>
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