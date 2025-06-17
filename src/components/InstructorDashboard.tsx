'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, ClipboardList, MessageSquare, Plus, BarChart3 } from 'lucide-react'

interface Course {
  id: string
  title: string
  code: string
  _count: {
    enrollments: number
    assignments: number
  }
}

interface Assignment {
  id: string
  title: string
  dueDate: string | null
  course: { title: string; code: string }
  _count: {
    submissions: number
  }
}

export default function InstructorDashboard() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [coursesRes, assignmentsRes] = await Promise.all([
          fetch('/api/instructor/courses'),
          fetch('/api/instructor/assignments/recent')
        ])

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData)
        }

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json()
          setRecentAssignments(assignmentsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  const totalStudents = courses.reduce((sum, course) => sum + course._count.enrollments, 0)
  const totalAssignments = courses.reduce((sum, course) => sum + course._count.assignments, 0)

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {session?.user.name}!
          </h1>
          <p className="text-white/90">Manage your courses and track student progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-pink-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-secondary truncate">My Courses</dt>
                  <dd className="text-lg font-medium text-text-primary">{courses.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-secondary truncate">Total Students</dt>
                  <dd className="text-lg font-medium text-text-primary">{totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-secondary truncate">Total Assignments</dt>
                  <dd className="text-lg font-medium text-text-primary">{totalAssignments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-pink-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-secondary truncate">Pending Grades</dt>
                  <dd className="text-lg font-medium text-text-primary">--</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-card-bg shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-text-primary">My Courses</h3>
              <Link
                href="/instructor/courses/new"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Course
              </Link>
            </div>
            {courses.length === 0 ? (
              <p className="text-text-secondary">You haven't created any courses yet.</p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/instructor/courses/${course.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-bg-content transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-text-primary">{course.title}</h4>
                        <p className="text-sm text-text-secondary">{course.code}</p>
                        <div className="flex space-x-4 mt-1">
                          <span className="text-sm text-text-secondary">
                            {course._count.enrollments} students
                          </span>
                          <span className="text-sm text-text-secondary">
                            {course._count.assignments} assignments
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card-bg shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">Recent Assignments</h3>
            {recentAssignments.length === 0 ? (
              <p className="text-text-secondary">No recent assignments.</p>
            ) : (
              <div className="space-y-3">
                {recentAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-3 border border-gray-200 rounded-lg bg-bg-content"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-text-primary">{assignment.title}</h4>
                        <p className="text-sm text-text-secondary">{assignment.course.code} - {assignment.course.title}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          {assignment.dueDate && (
                            <span className="text-sm text-text-secondary">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-sm text-pink-500">
                            {assignment._count.submissions} submissions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card-bg shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/instructor/courses/new"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <BookOpen className="h-5 w-5 mr-2 text-pink-500" />
              Create Course
            </Link>
            <Link
              href="/instructor/assignments"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <ClipboardList className="h-5 w-5 mr-2 text-purple-500" />
              Manage Assignments
            </Link>
            <Link
              href="/instructor/gradebook"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Gradebook
            </Link>
            <Link
              href="/instructor/announcements/new"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <MessageSquare className="h-5 w-5 mr-2 text-pink-500" />
              Manage Announcements
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}