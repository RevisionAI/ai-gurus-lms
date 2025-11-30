'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { BookOpen, Users, Calendar, Search, MoreVertical, LogOut, AlertTriangle } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

interface Course {
  id: string
  title: string
  description: string | null
  code: string
  semester: string
  year: number
  instructor?: {
    name: string | null
  } | null
  _count?: {
    enrollments: number
  }
  prerequisites: string | null
}

export default function CoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)
  const [prerequisiteConfirmed, setPrerequisiteConfirmed] = useState<Record<string, boolean>>({})
  const [unenrolling, setUnenrolling] = useState<string | null>(null)
  const [unenrollConfirmOpen, setUnenrollConfirmOpen] = useState(false)
  const [courseToUnenroll, setCourseToUnenroll] = useState<Course | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let endpoint = '/api/courses'
        if (session?.user.role === 'STUDENT') {
          endpoint = '/api/student/courses'
        } else if (session?.user.role === 'INSTRUCTOR') {
          endpoint = '/api/instructor/courses'
        }

        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          setCourses(data)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchAvailableCourses = async () => {
      if (session?.user.role === 'STUDENT') {
        try {
          const response = await fetch('/api/student/available-courses')
          if (response.ok) {
            const data = await response.json()
            setAvailableCourses(data)
          }
        } catch (error) {
          console.error('Error fetching available courses:', error)
        }
      }
    }

    if (session) {
      fetchCourses()
      fetchAvailableCourses()
    }
  }, [session])

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId)
    setEnrollmentError(null)
    
    try {
      const response = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enroll in course')
      }

      // After successful enrollment, move the course from available to enrolled
      const enrolledCourse = availableCourses.find(course => course.id === courseId)
      if (enrolledCourse) {
        setCourses(prevCourses => [...prevCourses, enrolledCourse])
        setAvailableCourses(prevCourses => prevCourses.filter(course => course.id !== courseId))
      }
    } catch (error) {
      console.error('Error enrolling in course:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to enroll in course'
      setEnrollmentError(errorMessage)
    } finally {
      setEnrolling(null)
    }
  }

  const handleUnenrollClick = (course: Course) => {
    setCourseToUnenroll(course)
    setUnenrollConfirmOpen(true)
  }

  const handleUnenroll = async () => {
    if (!courseToUnenroll) return

    setUnenrolling(courseToUnenroll.id)

    try {
      const response = await fetch('/api/student/unenroll', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: courseToUnenroll.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unenroll from course')
      }

      // Move course from enrolled to available
      setCourses(prevCourses => prevCourses.filter(c => c.id !== courseToUnenroll.id))
      setAvailableCourses(prevCourses => [...prevCourses, courseToUnenroll])
      setUnenrollConfirmOpen(false)
      setCourseToUnenroll(null)
    } catch (error) {
      console.error('Error unenrolling from course:', error)
      alert(error instanceof Error ? error.message : 'Failed to unenroll from course')
    } finally {
      setUnenrolling(null)
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor?.name && course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredAvailableCourses = availableCourses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor?.name && course.instructor.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pink-500"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-card-bg shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">
                  {session?.user.role === 'STUDENT' ? 'My Courses' : 
                   session?.user.role === 'INSTRUCTOR' ? 'My Courses' : 'All Courses'}
                </h1>
                {session?.user.role === 'INSTRUCTOR' && (
                  <Link
                    href="/instructor/courses/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Create Course
                  </Link>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-white/70" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 placeholder-white/60 text-white focus:outline-none focus:placeholder-white/40 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Enrolled Courses */}
              {session?.user.role === 'STUDENT' && (
                <>
                  <h2 className="text-xl font-bold text-white mb-4">My Enrolled Courses</h2>
                  {filteredCourses.length === 0 ? (
                    <div className="text-center py-8 bg-gray-800 rounded-lg mb-8">
                      <BookOpen className="mx-auto h-12 w-12 text-pink-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">
                        {searchTerm ? 'No enrolled courses found' : 'You are not enrolled in any courses yet'}
                      </h3>
                      <p className="mt-1 text-sm text-white/90">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Check out available courses below.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                      {filteredCourses.map((course) => (
                        <div
                          key={course.id}
                          className="relative bg-card-bg border border-pink-100 dark:border-purple-800/30 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Dropdown Menu */}
                          <div className="absolute top-3 right-3 z-10">
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <button
                                  className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                                  aria-label="Course options"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                  className="min-w-[160px] bg-gray-800 rounded-md shadow-lg border border-gray-700 py-1 z-50"
                                  sideOffset={5}
                                  align="end"
                                >
                                  <DropdownMenu.Item
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 cursor-pointer outline-none"
                                    onClick={() => handleUnenrollClick(course)}
                                  >
                                    <LogOut className="h-4 w-4" />
                                    Unenroll from Course
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </div>

                          <Link href={`/courses/${course.id}`} className="block p-6">
                            <div className="flex items-center justify-between mb-2 pr-8">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                {course.code}
                              </span>
                              <span className="text-sm text-white/90">
                                {course.semester} {course.year}
                              </span>
                            </div>

                            <h3 className="text-lg font-medium text-white mb-2">
                              {course.title}
                            </h3>

                            {course.description && (
                              <p className="text-sm text-white/80 mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-sm text-white/90">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>Instructor: {course.instructor?.name || 'Unknown'}</span>
                              </div>
                              {course._count && (
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  <span>{course._count.enrollments} students</span>
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Available Courses */}
                  <h2 className="text-xl font-bold text-white mb-4 mt-8">Available Courses</h2>
                  {filteredAvailableCourses.length === 0 ? (
                    <div className="text-center py-8 bg-gray-800 rounded-lg">
                      <BookOpen className="mx-auto h-12 w-12 text-pink-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">
                        {searchTerm ? 'No available courses found' : 'No available courses at this time'}
                      </h3>
                      <p className="mt-1 text-sm text-white/90">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Check back later for new courses.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredAvailableCourses.map((course) => {
                        const hasPrerequisites = !!course.prerequisites
                        const isConfirmed = !hasPrerequisites || prerequisiteConfirmed[course.id]
                        return (
                        <div
                          key={course.id}
                          className="block bg-card-bg border border-green-100 dark:border-purple-800/30 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {course.code}
                              </span>
                              <span className="text-sm text-white/90">
                                {course.semester} {course.year}
                              </span>
                            </div>

                            <h3 className="text-lg font-medium text-white mb-2">
                              {course.title}
                            </h3>

                            {course.description && (
                              <p className="text-sm text-white/80 mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-sm text-white/90 mb-4">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>Instructor: {course.instructor?.name || 'Unknown'}</span>
                              </div>
                              {course._count && (
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  <span>{course._count.enrollments} students</span>
                                </div>
                              )}
                            </div>

                            {/* Prerequisites Warning */}
                            {hasPrerequisites && (
                              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                                <div className="flex items-start">
                                  <svg className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <div className="ml-2">
                                    <h4 className="text-sm font-medium text-yellow-300">Prerequisites Required</h4>
                                    <p className="mt-1 text-sm text-yellow-100/80 whitespace-pre-wrap">{course.prerequisites}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Prerequisites Confirmation Checkbox */}
                            {hasPrerequisites && (
                              <div className="mb-4">
                                <label className="flex items-start cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={prerequisiteConfirmed[course.id] || false}
                                    onChange={(e) => setPrerequisiteConfirmed(prev => ({
                                      ...prev,
                                      [course.id]: e.target.checked
                                    }))}
                                    className="mt-1 h-4 w-4 text-pink-500 focus:ring-pink-500 border-gray-500 rounded bg-gray-700"
                                  />
                                  <span className="ml-2 text-sm text-white/80 group-hover:text-white">
                                    I confirm that I meet the prerequisites for this course
                                  </span>
                                </label>
                              </div>
                            )}

                            <div className="text-right">
                              {enrollmentError && enrolling === course.id && (
                                <p className="text-sm text-red-400 mb-2">{enrollmentError}</p>
                              )}
                              <button
                                onClick={() => handleEnroll(course.id)}
                                disabled={enrolling === course.id || !isConfirmed}
                                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                  enrolling === course.id || !isConfirmed
                                  ? 'bg-purple-400/50 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90'
                                }`}
                                title={!isConfirmed ? 'Please confirm you meet the prerequisites' : ''}
                              >
                                {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </>
              )}
              
              {/* Non-student view remains unchanged */}
              {session?.user.role !== 'STUDENT' && (
                <>
                  {filteredCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="mx-auto h-12 w-12 text-pink-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">
                        {searchTerm ? 'No courses found' : 'No courses available'}
                      </h3>
                      <p className="mt-1 text-sm text-white/90">
                        {searchTerm ? 'Try adjusting your search terms.' : 
                         session?.user.role === 'INSTRUCTOR' ? 'Get started by creating a new course.' :
                         'Check back later for new courses.'}
                      </p>
                      {session?.user.role === 'INSTRUCTOR' && !searchTerm && (
                        <div className="mt-6">
                          <Link
                            href="/instructor/courses/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Create your first course
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredCourses.map((course) => (
                        <Link
                          key={course.id}
                          href={
                            session?.user.role === 'INSTRUCTOR' 
                              ? `/instructor/courses/${course.id}`
                              : `/courses/${course.id}`
                          }
                          className="block bg-card-bg border border-pink-100 dark:border-purple-800/30 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                {course.code}
                              </span>
                              <span className="text-sm text-white/90">
                                {course.semester} {course.year}
                              </span>
                            </div>
                            
                            <h3 className="text-lg font-medium text-white mb-2">
                              {course.title}
                            </h3>
                            
                            {course.description && (
                              <p className="text-sm text-white/80 mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-sm text-white/90">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>Instructor: {course.instructor?.name || 'Unknown'}</span>
                              </div>
                              {course._count && (
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  <span>{course._count.enrollments} students</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        {/* Unenroll Confirmation Modal */}
        <AlertDialog.Root open={unenrollConfirmOpen} onOpenChange={setUnenrollConfirmOpen}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 w-full max-w-md z-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <AlertDialog.Title className="text-lg font-semibold text-white">
                  Unenroll from Course
                </AlertDialog.Title>
              </div>

              <AlertDialog.Description className="text-gray-300 mb-6">
                Are you sure you want to unenroll from{' '}
                <span className="font-medium text-white">{courseToUnenroll?.title}</span>?
                <br /><br />
                <span className="text-yellow-400 text-sm">
                  Warning: Any progress, grades, or submissions in this course may be lost.
                </span>
              </AlertDialog.Description>

              <div className="flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={handleUnenroll}
                    disabled={unenrolling !== null}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {unenrolling ? 'Unenrolling...' : 'Unenroll'}
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </ProtectedRoute>
  )
}