'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { generateBreadcrumbs } from '@/components/Breadcrumb'
import { ArrowLeft } from 'lucide-react'

interface DiscussionPost {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
  }
  replies: DiscussionPost[]
}

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
  posts: DiscussionPost[]
}

export default function InstructorDiscussionDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; discussionId: string }> 
}) {
  const [courseId, setCourseId] = useState<string>('')
  const [discussionId, setDiscussionId] = useState<string>('')
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params
      setCourseId(resolvedParams.id)
      setDiscussionId(resolvedParams.discussionId)
    }
    fetchParams()
  }, [params])

  useEffect(() => {
    if (courseId && discussionId) {
      fetchDiscussion()
    }
  }, [courseId, discussionId])

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.push(`/instructor/courses/${courseId}/discussions`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, courseId])

  const fetchDiscussion = async () => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/discussions/${discussionId}`)
      if (response.ok) {
        const data = await response.json()
        setDiscussion(data)
      } else {
        console.error('Failed to fetch discussion')
      }
    } catch (error) {
      console.error('Error fetching discussion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePin = async () => {
    if (!discussion) return

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/discussions/${discussionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned: !discussion.isPinned }),
      })

      if (response.ok) {
        const updatedDiscussion = await response.json()
        setDiscussion({ ...discussion, isPinned: updatedDiscussion.isPinned })
      } else {
        alert('Failed to update discussion')
      }
    } catch (error) {
      console.error('Error updating discussion:', error)
      alert('An error occurred while updating the discussion')
    }
  }

  const handleToggleLock = async () => {
    if (!discussion) return

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/discussions/${discussionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLocked: !discussion.isLocked }),
      })

      if (response.ok) {
        const updatedDiscussion = await response.json()
        setDiscussion({ ...discussion, isLocked: updatedDiscussion.isLocked })
      } else {
        alert('Failed to update discussion')
      }
    } catch (error) {
      console.error('Error updating discussion:', error)
      alert('An error occurred while updating the discussion')
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

  const renderPost = (post: DiscussionPost, level: number = 0) => {
    const marginLeft = level * 40

    return (
      <div key={post.id} style={{ marginLeft: `${marginLeft}px` }} className="border-l-2 border-gray-200 pl-4 py-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {post.author.name || post.author.email}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(post.createdAt)}
              </span>
              {post.createdAt !== post.updatedAt && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
        
        {post.replies && post.replies.length > 0 && (
          <div className="mt-4">
            {post.replies.map(reply => renderPost(reply, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!courseId || !discussionId) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-8">
              <p className="text-gray-500">Loading discussion...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!discussion) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-8">
              <p className="text-gray-500">Discussion not found</p>
              <button
                onClick={() => router.push(`/instructor/courses/${courseId}/discussions`)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Discussions
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb 
            items={generateBreadcrumbs.instructorDiscussion(
              courseId, 
              'Course',
              discussionId, 
              discussion?.title
            )} 
          />

          <div className="bg-white rounded-lg shadow p-6">
            {/* Back Button */}
            <div className="mb-6">
              <Link
                href={`/instructor/courses/${courseId}/discussions`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Discussions
              </Link>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{discussion.title}</h1>
                  {discussion.isPinned && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pinned</span>
                  )}
                  {discussion.isLocked && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Locked</span>
                  )}
                </div>
                {discussion.description && (
                  <p className="text-gray-600 mb-4">{discussion.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Created by {discussion.author.name || discussion.author.email}</span>
                  <span>{formatDate(discussion.createdAt)}</span>
                  <span>{discussion.posts.length} posts</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleTogglePin}
                  className={`px-3 py-1 text-sm rounded ${
                    discussion.isPinned 
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {discussion.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={handleToggleLock}
                  className={`px-3 py-1 text-sm rounded ${
                    discussion.isLocked 
                      ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {discussion.isLocked ? 'Unlock' : 'Lock'}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Posts</h2>
              {discussion.posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No posts yet. Students can start the conversation.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {discussion.posts.map(post => renderPost(post))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}