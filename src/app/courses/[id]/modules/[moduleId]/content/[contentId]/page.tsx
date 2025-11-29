'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb from '@/components/Breadcrumb'
import {
  ArrowLeft,
  FileText,
  Video,
  File,
  Link as LinkIcon,
  BookOpen,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Unlock,
} from 'lucide-react'

type ContentType = 'TEXT' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'SCORM' | 'YOUTUBE'

interface ContentData {
  id: string
  title: string
  type: ContentType
  content: string | null
  fileUrl: string | null
  thumbnailUrl: string | null
}

interface ModuleInfo {
  id: string
  title: string
}

interface CourseInfo {
  id: string
  title: string
}

function getContentIcon(type: ContentType) {
  switch (type) {
    case 'TEXT':
      return FileText
    case 'VIDEO':
      return Video
    case 'YOUTUBE':
      return Video
    case 'DOCUMENT':
      return File
    case 'LINK':
      return LinkIcon
    case 'SCORM':
      return BookOpen
    default:
      return FileText
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export default function StudentContentViewerPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const moduleId = params.moduleId as string
  const contentId = params.contentId as string

  const [contentData, setContentData] = useState<ContentData | null>(null)
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null)
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarkedComplete, setIsMarkedComplete] = useState(false)
  const completionCalledRef = useRef(false)

  const fetchContentData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch module detail for course and module info
      const moduleResponse = await fetch(
        `/api/student/courses/${courseId}/modules/${moduleId}`
      )

      if (!moduleResponse.ok) {
        const data = await moduleResponse.json()
        throw new Error(data.error || 'Failed to fetch module')
      }

      const moduleData = await moduleResponse.json()
      setCourseInfo(moduleData.course)
      setModuleInfo({ id: moduleData.module.id, title: moduleData.module.title })

      // Fetch content using module-scoped endpoint (Security Fix: Story 3.3)
      // This endpoint verifies module unlock authorization
      const contentResponse = await fetch(
        `/api/student/courses/${courseId}/modules/${moduleId}/content/${contentId}`
      )

      if (!contentResponse.ok) {
        const data = await contentResponse.json()
        throw new Error(data.error || 'Failed to fetch content details')
      }

      const content = await contentResponse.json()
      setContentData(content)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch content'
      setError(message)
      console.error('Error fetching content:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mark content as viewed on load (Story 3.4)
  // Story 3.6: Show unlock toast when completing a module
  const markContentComplete = useCallback(async () => {
    // Prevent duplicate calls
    if (completionCalledRef.current) return
    completionCalledRef.current = true

    try {
      const response = await fetch(
        `/api/student/courses/${courseId}/modules/${moduleId}/content/${contentId}/complete`,
        { method: 'POST' }
      )

      if (response.ok) {
        setIsMarkedComplete(true)

        // Check for module unlock (Story 3.6)
        const data = await response.json()
        if (data.unlockedModule) {
          toast.success(
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              <span>
                <strong>{data.unlockedModule.title}</strong> is now available!
              </span>
            </div>,
            {
              duration: 5000,
              position: 'top-center',
            }
          )
        }
      }
    } catch (err) {
      // Silently fail - completion tracking is non-critical
      console.error('Error marking content complete:', err)
    }
  }, [courseId, moduleId, contentId])

  useEffect(() => {
    if (courseId && moduleId && contentId) {
      fetchContentData()
    }
  }, [courseId, moduleId, contentId])

  // Trigger completion when content is loaded
  useEffect(() => {
    if (contentData && !completionCalledRef.current) {
      markContentComplete()
    }
  }, [contentData, markContentComplete])

  const Icon = contentData ? getContentIcon(contentData.type) : FileText

  // Loading State
  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 sm:px-0">
              <div className="h-6 bg-gray-200 rounded w-64 mb-6 animate-pulse" />
              <div className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-64 bg-gray-100 rounded" />
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // Error State
  if (error) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 sm:px-0">
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="mx-auto h-12 w-12 text-red-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to load content
                </h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={fetchContentData}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </button>
                  <Link
                    href={`/courses/${courseId}/modules/${moduleId}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Module
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!contentData) return null

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="px-4 sm:px-0">
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: courseInfo?.title || 'Course', href: `/courses/${courseId}` },
                { label: moduleInfo?.title || 'Module', href: `/courses/${courseId}/modules/${moduleId}` },
                { label: contentData.title },
              ]}
            />
          </div>

          {/* Content Header */}
          <div className="mt-6 px-4 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-gray-100">
                    <Icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {contentData.title}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500 capitalize">
                        {contentData.type.toLowerCase().replace('_', ' ')}
                      </span>
                      {isMarkedComplete && (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Marked as viewed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/courses/${courseId}/modules/${moduleId}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Module
                </Link>
              </div>
            </div>

            {/* Content Display */}
            <div className="bg-white shadow rounded-lg p-6">
              {/* TEXT content */}
              {contentData.type === 'TEXT' && contentData.content && (
                <div className="prose prose-sm max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: contentData.content }}
                  />
                </div>
              )}

              {/* YOUTUBE content */}
              {contentData.type === 'YOUTUBE' && contentData.fileUrl && (
                <div>
                  {(() => {
                    const videoId = extractYouTubeId(contentData.fileUrl)
                    return videoId ? (
                      <div className="space-y-4">
                        <div className="aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={contentData.title}
                            className="w-full h-full rounded-lg border border-gray-200"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <a
                          href={contentData.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Watch on YouTube
                        </a>
                      </div>
                    ) : (
                      <a
                        href={contentData.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Watch Video
                      </a>
                    )
                  })()}
                </div>
              )}

              {/* VIDEO content */}
              {contentData.type === 'VIDEO' && contentData.fileUrl && (
                <div>
                  <video
                    src={contentData.fileUrl}
                    controls
                    className="w-full rounded-lg"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* DOCUMENT content */}
              {contentData.type === 'DOCUMENT' && contentData.fileUrl && (
                <div className="text-center py-8">
                  <File className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Document Available
                  </h3>
                  <a
                    href={contentData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download Document
                  </a>
                </div>
              )}

              {/* LINK content */}
              {contentData.type === 'LINK' && contentData.fileUrl && (
                <div className="text-center py-8">
                  <LinkIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    External Resource
                  </h3>
                  <a
                    href={contentData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Link
                  </a>
                </div>
              )}

              {/* SCORM content */}
              {contentData.type === 'SCORM' && contentData.fileUrl && (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Interactive Content
                  </h3>
                  <p className="text-gray-500 mb-4">
                    This content will open in a new window.
                  </p>
                  <a
                    href={contentData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Launch Content
                  </a>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
