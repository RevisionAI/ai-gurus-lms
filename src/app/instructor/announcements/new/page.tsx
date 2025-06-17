'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface Course {
  id: string
  title: string
  code: string
}

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchingCourses, setFetchingCourses] = useState<boolean>(true)

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/instructor/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
          
          // Pre-select the first course if available
          if (data.length > 0) {
            setSelectedCourse(data[0].id)
          }
        } else {
          toast.error('Failed to fetch courses')
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
        toast.error('An error occurred while fetching courses')
      } finally {
        setFetchingCourses(false)
      }
    }

    fetchCourses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCourse) {
      toast.error('Please select a course')
      return
    }
    
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
      const response = await fetch(`/api/instructor/courses/${selectedCourse}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      })
      
      if (response.ok) {
        toast.success('Announcement created successfully')
        router.push('/instructor/announcements')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create announcement')
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast.error('An error occurred while creating the announcement')
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
              <h1 className="text-2xl font-semibold text-text-primary">Create New Announcement</h1>
            </div>
            
            {fetchingCourses ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-card-bg rounded-lg shadow p-6">
                <div className="text-center">
                  <h3 className="mt-2 text-lg font-medium text-text-primary">No courses found</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    You need to create a course before you can make an announcement.
                  </p>
                  <Link
                    href="/instructor/courses/new"
                    className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    Create Course
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card-bg rounded-lg shadow p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-text-secondary mb-1">
                      Select Course
                    </label>
                    <select
                      id="course"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="max-w-md mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-bg-content text-text-primary"
                      required
                    >
                      <option value="" disabled>
                        Select a course
                      </option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
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
                      disabled={loading || !selectedCourse || !title.trim() || !content.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin inline-block h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                          Creating...
                        </>
                      ) : (
                        'Create Announcement'
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
