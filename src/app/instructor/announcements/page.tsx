'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { MessageSquare, Plus, Edit, Trash2, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Course {
  id: string
  title: string
  code: string
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  courseId: string
  course: {
    id: string
    title: string
    code: string
  }
  author: {
    id: string
    name: string
    email: string
  }
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/instructor/courses')
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        } else {
          toast.error('Failed to fetch courses')
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
        toast.error('An error occurred while fetching courses')
      }
    }

    fetchCourses()
  }, [])

  // Fetch announcements for all courses or a specific course
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      
      try {
        if (selectedCourse === 'all') {
          // Fetch announcements for all courses
          const promises = courses.map(course => 
            fetch(`/api/instructor/courses/${course.id}/announcements`)
              .then(res => res.ok ? res.json() : [])
              .then((announcements: Announcement[]) => {
                // Ensure each announcement has proper course information
                return announcements.map((announcement: Announcement) => {
                  // If the course info is missing, populate it from our courses data
                  if (!announcement.course) {
                    return {
                      ...announcement,
                      course: {
                        id: course.id,
                        title: course.title,
                        code: course.code,
                      }
                    };
                  }
                  return announcement;
                });
              })
          )
          
          const results = await Promise.all(promises)
          const allAnnouncements = results.flat()
          setAnnouncements(allAnnouncements)
        } else {
          // Fetch announcements for the selected course
          const response = await fetch(`/api/instructor/courses/${selectedCourse}/announcements`)
          if (response.ok) {
            const data = await response.json()
            setAnnouncements(data)
          } else {
            toast.error('Failed to fetch announcements')
            setAnnouncements([])
          }
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
        toast.error('An error occurred while fetching announcements')
        setAnnouncements([])
      } finally {
        setLoading(false)
      }
    }

    if (courses.length > 0 || selectedCourse !== 'all') {
      fetchAnnouncements()
    } else {
      setLoading(false)
    }
  }, [courses, selectedCourse])

  const handleDeleteAnnouncement = async (courseId: string, announcementId: string) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/announcements/${announcementId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Announcement deleted successfully')
        // Update announcements list
        setAnnouncements(announcements.filter(a => a.id !== announcementId))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete announcement')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('An error occurred while deleting the announcement')
    } finally {
      setDeleteConfirm(null)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-text-primary">Manage Announcements</h1>
              <Link
                href="/instructor/announcements/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Link>
            </div>

            {courses.length > 0 && (
              <div className="mb-6">
                <label htmlFor="course-filter" className="block text-sm font-medium text-text-secondary mb-1">
                  Filter by Course
                </label>
                <select
                  id="course-filter"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="max-w-md mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-bg-content text-text-primary"
                >
                  <option value="all">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-card-bg rounded-lg shadow p-6">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-text-primary">No announcements</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {selectedCourse === 'all' 
                      ? "You haven't created any announcements yet." 
                      : "This course doesn't have any announcements yet."}
                  </p>
                  <Link
                    href="/instructor/announcements/new"
                    className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Announcement
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-card-bg rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <li key={announcement.id}>
                      <div className="px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <h3 className="text-lg font-medium text-text-primary">{announcement.title}</h3>
                            <span className="text-sm text-text-secondary mt-1 sm:mt-0">
                              {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-text-secondary">
                            {announcement.course ? `${announcement.course.code} - ${announcement.course.title}` : 'Course information unavailable'}
                          </p>
                          <p className="mt-2 text-sm text-text-primary line-clamp-2">{announcement.content}</p>
                        </div>
                        <div className="flex items-center mt-4 md:mt-0 md:ml-6">
                          <button
                            onClick={() => router.push(`/instructor/courses/${announcement.courseId}/announcements/${announcement.id}`)}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center mr-4"
                          >
                            View <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                          <Link
                            href={`/instructor/courses/${announcement.courseId}/announcements/${announcement.id}/edit`}
                            className="text-sm text-gray-600 hover:text-gray-800 flex items-center mr-4"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                          {deleteConfirm === announcement.id ? (
                            <div className="flex items-center">
                              <button
                                onClick={() => handleDeleteAnnouncement(announcement.courseId, announcement.id)}
                                className="text-sm text-red-600 hover:text-red-800 mr-2"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-sm text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(announcement.id)}
                              className="text-sm text-red-600 hover:text-red-800 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
