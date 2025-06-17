'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface Announcement {
  id: string
  title: string
  content: string
  courseId: string
  course: {
    id: string
    title: string
    code: string
  }
}

export default function EditAnnouncementPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const announcementId = params?.announcementId as string

  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchingAnnouncement, setFetchingAnnouncement] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [courseTitle, setCourseTitle] = useState<string>('')

  // Fetch announcement data
  useEffect(() => {
    const fetchAnnouncement = async () => {
      setFetchingAnnouncement(true)
      try {
        const response = await fetch(`/api/instructor/courses/${courseId}/announcements/${announcementId}`)
        
        if (response.ok) {
          const data = await response.json()
          setTitle(data.title)
          setContent(data.content)
          if (data.course) {
            setCourseTitle(`${data.course.code} - ${data.course.title}`)
          }
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
        setFetchingAnnouncement(false)
      }
    }

    if (courseId && announcementId) {
      fetchAnnouncement()
    } else {
      setError('Invalid course or announcement ID')
      setFetchingAnnouncement(false)
    }
  }, [courseId, announcementId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }
    
    if (!content.trim()) {
      toast.error('Please enter content')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/announcements/${announcementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      })
      
      if (response.ok) {
        toast.success('Announcement updated successfully')
        router.push('/instructor/announcements')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update announcement')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      toast.error('An error occurred while updating the announcement')
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-2xl font-semibold text-text-primary">Edit Announcement</h1>
            </div>
            
            {fetchingAnnouncement ? (
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
            ) : (
              <form onSubmit={handleSubmit} className="bg-card-bg rounded-lg shadow p-6">
                <div className="space-y-6">
                  {courseTitle && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Course
                      </label>
                      <div className="max-w-md mt-1 px-3 py-2 text-base border border-gray-300 rounded-md bg-gray-50 text-text-primary">
                        {courseTitle}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="max-w-md mt-1 block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-bg-content text-text-primary"
                      placeholder="Enter announcement title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-text-secondary mb-1">
                      Content
                    </label>
                    <textarea
                      id="content"
                      rows={8}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-bg-content text-text-primary"
                      placeholder="Enter announcement content"
                      required
                    ></textarea>
                    <p className="mt-2 text-sm text-text-secondary">
                      Write a clear message for your students. You can use line breaks for formatting.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Link 
                      href="/instructor/announcements" 
                      className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading || !title.trim() || !content.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Updating...
                        </>
                      ) : (
                        'Update Announcement'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
