'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ClipboardList, MessageSquare, GraduationCap, MoreVertical, LogOut, AlertTriangle } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { useGPA, CourseGPAData } from '@/hooks/useGPA'
import GPASummary from '@/components/gpa/GPASummary'

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

/**
 * Get GPA color class for display
 */
function getGPAColorClass(letterGrade: string): string {
  if (letterGrade.startsWith('A')) return 'text-green-400'
  if (letterGrade.startsWith('B')) return 'text-blue-400'
  if (letterGrade.startsWith('C')) return 'text-yellow-400'
  if (letterGrade.startsWith('D')) return 'text-orange-400'
  if (letterGrade === 'F') return 'text-red-400'
  return 'text-white'
}

/**
 * Find course GPA from the courseGPAs array
 */
function findCourseGPA(courseGPAs: CourseGPAData[], courseId: string): CourseGPAData | undefined {
  return courseGPAs.find(c => c.courseId === courseId)
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [unenrolling, setUnenrolling] = useState<string | null>(null)
  const [unenrollConfirmOpen, setUnenrollConfirmOpen] = useState(false)
  const [courseToUnenroll, setCourseToUnenroll] = useState<Course | null>(null)

  // Fetch GPA data using custom hook
  const { data: gpaData, isLoading: gpaLoading, error: gpaError, refetch: refetchGPA } = useGPA()

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

      // Remove course from list
      setCourses(prevCourses => prevCourses.filter(c => c.id !== courseToUnenroll.id))
      setUnenrollConfirmOpen(false)
      setCourseToUnenroll(null)
      // Refetch GPA data after unenrolling
      refetchGPA()
    } catch (error) {
      console.error('Error unenrolling from course:', error)
      alert(error instanceof Error ? error.message : 'Failed to unenroll from course')
    } finally {
      setUnenrolling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // Format GPA display value
  const overallGPADisplay = gpaLoading
    ? '...'
    : gpaData?.overallGPA !== null && gpaData?.overallGPA !== undefined
      ? gpaData.overallGPA.toFixed(2)
      : 'N/A'

  const overallLetterGrade = gpaData?.letterGrade || 'N/A'

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
                <BookOpen className="h-6 w-6 text-white" aria-hidden="true" />
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
                <ClipboardList className="h-6 w-6 text-white" aria-hidden="true" />
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
                <MessageSquare className="h-6 w-6 text-white" aria-hidden="true" />
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

        <div
          className="bg-button-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg"
          role="region"
          aria-label={`Overall GPA: ${overallGPADisplay} ${overallLetterGrade !== 'N/A' ? `(${overallLetterGrade})` : ''}`}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Overall GPA</dt>
                  <dd className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{overallGPADisplay}</span>
                    {overallLetterGrade !== 'N/A' && !gpaLoading && (
                      <span className={`text-sm font-semibold ${getGPAColorClass(overallLetterGrade)} bg-black/20 px-2 py-0.5 rounded`}>
                        {overallLetterGrade}
                      </span>
                    )}
                  </dd>
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
                {courses.map((course) => {
                  const courseGPA = gpaData?.courseGPAs ? findCourseGPA(gpaData.courseGPAs, course.id) : undefined
                  return (
                    <div
                      key={course.id}
                      className="relative p-3 border border-pink-100 dark:border-purple-800/30 rounded-lg hover:bg-bg-content transition-colors group"
                    >
                      {/* Dropdown Menu */}
                      <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button
                              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Course options"
                            >
                              <MoreVertical className="h-4 w-4" />
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
                                Unenroll
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>

                      <Link href={`/courses/${course.id}`} className="block">
                        <div className="flex justify-between items-start pr-6">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{course.title}</h4>
                            <p className="text-sm text-white">{course.code}</p>
                            <p className="text-sm text-white">Instructor: {course.instructor.name}</p>
                          </div>
                          {/* Course GPA Badge */}
                          {!gpaLoading && courseGPA && (
                            <div className="ml-3 text-right flex-shrink-0">
                              <div className={`text-lg font-bold ${getGPAColorClass(courseGPA.letterGrade)}`}>
                                {courseGPA.gpa !== null ? courseGPA.gpa.toFixed(2) : 'N/A'}
                              </div>
                              {courseGPA.letterGrade !== 'N/A' && (
                                <div className="text-xs text-white/60">{courseGPA.letterGrade}</div>
                              )}
                            </div>
                          )}
                          {gpaLoading && (
                            <div className="ml-3 text-right flex-shrink-0">
                              <div className="h-6 w-12 bg-white/20 rounded animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  )
                })}
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

      {/* GPA Summary Section */}
      {gpaData && gpaData.courseGPAs.length > 0 && (
        <GPASummary
          overallGPA={gpaData.overallGPA}
          overallPercentage={gpaData.percentage}
          overallLetterGrade={gpaData.letterGrade}
          courseGPAs={gpaData.courseGPAs}
          isLoading={gpaLoading}
          error={gpaError}
          onRetry={refetchGPA}
        />
      )}

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
  )
}
