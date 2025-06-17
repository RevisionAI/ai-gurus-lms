'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ClipboardList, MessageSquare, GraduationCap } from 'lucide-react'

interface Course {
  id: string
  title: string
  code: string
  instructor: { name: string }
}

interface Assignment {
  id: string
  title: string
  dueDate: string | null
  course: { title: string; code: string }
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  course: { id: string; title: string; code: string }
  author: { name: string }
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [coursesRes, assignmentsRes, announcementsRes] = await Promise.all([
          fetch('/api/student/courses'),
          fetch('/api/student/assignments/upcoming'),
          fetch('/api/student/announcements/recent')
        ])

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData)
        }

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json()
          setUpcomingAssignments(assignmentsData)
        }

        if (announcementsRes.ok) {
          const announcementsData = await announcementsRes.json()
          setRecentAnnouncements(announcementsData)
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

  return (
    <div className="space-y-6">
      <div className="bg-card-bg overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {session?.user.name}!
          </h1>
          <p className="text-white">Here's what's happening in your courses today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-accent-pink-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Enrolled Courses</dt>
                  <dd className="text-lg font-medium text-white">{courses.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-blue-purple-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Upcoming Assignments</dt>
                  <dd className="text-lg font-medium text-white">{upcomingAssignments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-orange-yellow-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">New Announcements</dt>
                  <dd className="text-lg font-medium text-white">{recentAnnouncements.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-button-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Overall GPA</dt>
                  <dd className="text-lg font-medium text-white">--</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-card-bg shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-white mb-4">My Courses</h3>
            {courses.length === 0 ? (
              <p className="text-white">You are not enrolled in any courses yet.</p>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="block p-3 border border-pink-100 dark:border-purple-800/30 rounded-lg hover:bg-bg-content transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">{course.title}</h4>
                        <p className="text-sm text-white">{course.code}</p>
                        <p className="text-sm text-white">Instructor: {course.instructor.name}</p>
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
            <h3 className="text-lg leading-6 font-medium text-white mb-4">Upcoming Assignments</h3>
            {upcomingAssignments.length === 0 ? (
              <p className="text-white">No upcoming assignments.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-3 border border-pink-100 dark:border-purple-800/30 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">{assignment.title}</h4>
                        <p className="text-sm text-white">{assignment.course.code} - {assignment.course.title}</p>
                        {assignment.dueDate && (
                          <p className="text-sm text-red-600">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        )}
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
          <h3 className="text-lg leading-6 font-medium text-white mb-4">Recent Announcements</h3>
          {recentAnnouncements.length === 0 ? (
            <p className="text-white">No recent announcements.</p>
          ) : (
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => (
                <Link
                  key={announcement.id}
                  href={`/courses/${announcement.course.id}/announcements`}
                  className="block p-4 border border-pink-100 dark:border-purple-800/30 rounded-lg hover:bg-bg-content hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-text-primary">{announcement.title}</h4>
                    <span className="text-sm text-text-secondary">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2 line-clamp-2">{announcement.content}</p>
                  <p className="text-xs text-text-secondary/70">
                    {announcement.course.code} - {announcement.course.title} • {announcement.author.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}