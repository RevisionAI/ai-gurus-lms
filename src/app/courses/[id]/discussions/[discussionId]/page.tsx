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

interface Course {
  id: string
  title: string
}

export default function StudentDiscussionDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; discussionId: string }> 
}) {
  const [courseId, setCourseId] = useState<string>('')
  const [discussionId, setDiscussionId] = useState<string>('')
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
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
      fetchCourse()
    }
  }, [courseId, discussionId])

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.push(`/courses/${courseId}/discussions`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, courseId])

  const fetchDiscussion = async () => {
    try {
      const response = await fetch(`/api/student/courses/${courseId}/discussions/${discussionId}`)
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

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/student/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse({ id: data.id, title: data.title })
      } else {
        console.error('Failed to fetch course')
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    }
  }

  const handleCreatePost = async (parentId: string | null = null) => {
    if (!replyContent.trim() || !discussion) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/student/courses/${courseId}/discussions/${discussionId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId
        }),
      })

      if (response.ok) {
        setReplyContent('')
        setShowReplyForm(null)
        await fetchDiscussion() // Refresh the discussion
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('An error occurred while creating the post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/student/courses/${courseId}/discussions/${discussionId}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim()
        }),
      })

      if (response.ok) {
        setEditContent('')
        setEditingPost(null)
        await fetchDiscussion() // Refresh the discussion
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to edit post')
      }
    } catch (error) {
      console.error('Error editing post:', error)
      alert('An error occurred while editing the post')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/student/courses/${courseId}/discussions/${discussionId}/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchDiscussion() // Refresh the discussion
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('An error occurred while deleting the post')
    }
  }

  const startEdit = (post: DiscussionPost) => {
    setEditingPost(post.id)
    setEditContent(post.content)
  }

  const cancelEdit = () => {
    setEditingPost(null)
    setEditContent('')
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
    const isAuthor = session?.user?.id === post.author.id
    const isEditing = editingPost === post.id

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
            {isAuthor && !discussion?.isLocked && (
              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(post)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Edit your post..."
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditPost(post.id)}
                  disabled={submitting || !editContent.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-gray-700 whitespace-pre-wrap mb-3">
                {post.content}
              </div>
              {!discussion?.isLocked && (
                <button
                  onClick={() => setShowReplyForm(showReplyForm === post.id ? null : post.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Reply
                </button>
              )}
            </>
          )}
          
          {showReplyForm === post.id && !discussion?.isLocked && (
            <div className="mt-3 space-y-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Write your reply..."
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCreatePost(post.id)}
                  disabled={submitting || !replyContent.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </button>
                <button
                  onClick={() => setShowReplyForm(null)}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
      <ProtectedRoute allowedRoles={['STUDENT']}>
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
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-8">
              <p className="text-gray-500">Discussion not found</p>
              <button
                onClick={() => router.push(`/courses/${courseId}/discussions`)}
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
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb Navigation */}
          <Breadcrumb 
            items={generateBreadcrumbs.studentDiscussion(
              courseId, 
              course?.title,
              discussionId, 
              discussion?.title
            )} 
          />

          <div className="bg-white rounded-lg shadow p-6">
            {/* Back Button */}
            <div className="mb-6">
              <Link
                href={`/courses/${courseId}/discussions`}
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
                  <span>Started by {discussion.author.name || discussion.author.email}</span>
                  <span>{formatDate(discussion.createdAt)}</span>
                  <span>{discussion.posts.length} posts</span>
                </div>
              </div>
            </div>

            {!discussion.isLocked && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-3">Start a new conversation</h3>
                <div className="space-y-3">
                  <textarea
                    value={showReplyForm === 'new' ? replyContent : ''}
                    onChange={(e) => {
                      setReplyContent(e.target.value)
                      if (showReplyForm !== 'new') setShowReplyForm('new')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Share your thoughts..."
                  />
                  {showReplyForm === 'new' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCreatePost(null)}
                        disabled={submitting || !replyContent.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Posting...' : 'Post'}
                      </button>
                      <button
                        onClick={() => {
                          setShowReplyForm(null)
                          setReplyContent('')
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Discussion</h2>
              {discussion.posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {discussion.isLocked ? 'This discussion is locked.' : 'Be the first to start the conversation!'}
                  </p>
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