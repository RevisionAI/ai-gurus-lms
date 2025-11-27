'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ClipboardList, Plus, ChevronRight, Calendar, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

interface Course {
  id: string
  title: string
  code: string
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxPoints: number
  courseId: string
  course: {
    id: string
    title: string
    code: string
  }
}

export default function AssignmentsPage() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')

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

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true)
      
      try {
        if (selectedCourse === 'all') {
          // Fetch assignments for all courses
          const promises = courses.map(course => 
            fetch(`/api/instructor/courses/${course.id}/assignments`)
              .then(res => res.ok ? res.json() : [])
              .then((assignments: Record<string, unknown>[]) => {
                // Ensure each assignment has proper course information
                return assignments.map(assignment => {
                  if (!assignment.course) {
                    return {
                      ...assignment,
                      course: {
                        id: course.id,
                        title: course.title,
                        code: course.code,
                      }
                    };
                  }
                  return assignment;
                });
              })
          )
          
          const results = await Promise.all(promises)
          const allAssignments = results.flat()
          setAssignments(allAssignments)
        } else {
          // Fetch assignments for the selected course
          const response = await fetch(`/api/instructor/courses/${selectedCourse}/assignments`)
          if (response.ok) {
            const data = await response.json()
            setAssignments(data)
          } else {
            toast.error('Failed to fetch assignments')
            setAssignments([])
          }
        }
      } catch (error) {
        console.error('Error fetching assignments:', error)
        toast.error('An error occurred while fetching assignments')
        setAssignments([])
      } finally {
        setLoading(false)
      }
    }

    if (courses.length > 0 || selectedCourse !== 'all') {
      fetchAssignments()
    } else {
      setLoading(false)
    }
  }, [courses, selectedCourse])

  // Format due date in a readable way
  const formatDueDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const isOverdue = (date: string) => {
    try {
      return new Date(date) < new Date()
    } catch (error) {
      return false
    }
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-text-primary">Manage Assignments</h1>
              <div className="space-x-4">
                {selectedCourse !== 'all' && (
                  <Link
                    href={`/instructor/courses/${selectedCourse}/assignments/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Assignment
                  </Link>
                )}
              </div>
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
            ) : assignments.length === 0 ? (
              <div className="bg-card-bg rounded-lg shadow p-6">
                <div className="text-center">
                  <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-text-primary">No assignments</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {selectedCourse === 'all' 
                      ? "You haven't created any assignments yet." 
                      : "This course doesn't have any assignments yet."}
                  </p>
                  {selectedCourse !== 'all' && (
                    <Link
                      href={`/instructor/courses/${selectedCourse}/assignments/new`}
                      className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Link>
                  )}
                  {selectedCourse === 'all' && (
                    <p className="mt-4 text-sm text-text-secondary">
                      Select a course to create a new assignment.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card-bg rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <li key={assignment.id}>
                      <div className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <h3 className="text-lg font-medium text-text-primary">{assignment.title}</h3>
                              <div className="mt-1 sm:mt-0 flex items-center">
                                <span className={`inline-flex items-center text-sm ${isOverdue(assignment.dueDate) ? 'text-red-500' : 'text-text-secondary'}`}>
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Due: {formatDueDate(assignment.dueDate)}
                                </span>
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-text-secondary">
                              {assignment.course ? `${assignment.course.code} - ${assignment.course.title}` : 'Course information unavailable'}
                            </p>
                            <p className="mt-2 text-sm text-text-primary line-clamp-2">{assignment.description}</p>
                            <p className="mt-2 text-sm font-medium text-text-primary">
                              Max Points: {assignment.maxPoints}
                            </p>
                          </div>
                          <div className="flex items-center mt-4 sm:mt-0 sm:ml-6">
                            <Link
                              href={`/instructor/courses/${assignment.courseId}/assignments/${assignment.id}/edit`}
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              View Details <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </div>
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
