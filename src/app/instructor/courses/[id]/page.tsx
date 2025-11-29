'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import ModuleList from '@/components/modules/ModuleList'
import { Users, ClipboardList, MessageSquare, Settings, Plus, FileText, Calendar, X, Layers, BookOpen } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  code: string
  semester: string
  year: number
  isActive: boolean
  instructor: {
    name: string
  }
  _count: {
    enrollments: number
    assignments: number
    discussions: number
    announcements: number
    content: number
  }
}

interface Enrollment {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [allStudents, setAllStudents] = useState<Array<{id: string, name: string, email: string, image?: string | null}>>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [courseRes, enrollmentsRes] = await Promise.all([
          fetch(`/api/instructor/courses/${params.id}`),
          fetch(`/api/instructor/courses/${params.id}/enrollments`)
        ])

        if (courseRes.ok) {
          const courseData = await courseRes.json()
          setCourse(courseData)
        }

        if (enrollmentsRes.ok) {
          const enrollmentsData = await enrollmentsRes.json()
          setEnrollments(enrollmentsData)
        }
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCourseData()
    }
  }, [params.id])

  const handleAddStudentClick = () => {
    setShowAddStudentModal(true)
    setSelectedStudentId('')
    setEnrollmentError(null)
    fetchAllStudents()
  }
  
  const fetchAllStudents = async () => {
    setIsLoadingStudents(true)
    try {
      const response = await fetch('/api/users/students')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch students')
      }
      const students = await response.json()
      setAllStudents(students)
    } catch (error: unknown) {
      console.error('Error fetching students:', error)
      setEnrollmentError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddStudentModal(false)
  }

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) {
      setEnrollmentError('Please select a student to enroll')
      return
    }
    
    setIsEnrolling(true)
    setEnrollmentError(null)
    try {
      const response = await fetch(`/api/instructor/courses/${params.id}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedStudentId }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enroll student')
      }
      const newEnrollment = await response.json()
      setEnrollments((prevEnrollments) => [...prevEnrollments, newEnrollment])
      setCourse(prevCourse => prevCourse ? ({ ...prevCourse, _count: { ...prevCourse._count, enrollments: prevCourse._count.enrollments + 1 } }) : null);
      // Filter out the enrolled student from the all students list
      setAllStudents(students => students.filter(student => student.id !== selectedStudentId))
      setSelectedStudentId('')
    } catch (error: unknown) {
      console.error('Error enrolling student:', error)
      setEnrollmentError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleToggleCourseStatus = async () => {
    if (!course) return;
    setIsUpdatingStatus(true);
    const newStatus = !course.isActive;
    try {
      const response = await fetch(`/api/instructor/courses/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course status');
      }
      const updatedCourse = await response.json();
      setCourse(updatedCourse);
    } catch (error: unknown) {
      console.error('Error updating course status:', error);
      // Handle error display to user, e.g., using a toast notification
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`); // Simple alert for now
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!course) {
    return (
      <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-500">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'modules', name: 'Modules', icon: Layers },
    { id: 'students', name: 'Students', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ]

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Course Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                  <p className="text-sm text-gray-500">{course.code} • {course.semester} {course.year}</p>
                  {course.description && (
                    <p className="mt-2 text-gray-600">{course.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Students</dt>
                      <dd className="text-lg font-medium text-gray-900">{course._count.enrollments}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Content</dt>
                      <dd className="text-lg font-medium text-gray-900">{course._count.content}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardList className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Assignments</dt>
                      <dd className="text-lg font-medium text-gray-900">{course._count.assignments}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Discussions</dt>
                      <dd className="text-lg font-medium text-gray-900">{course._count.discussions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Announcements</dt>
                      <dd className="text-lg font-medium text-gray-900">{course._count.announcements}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setActiveTab('modules')}
                          className="block w-full text-left p-3 border border-indigo-200 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <Layers className="h-5 w-5 text-indigo-600 mr-3" />
                            <div>
                              <span className="font-medium text-indigo-900">Manage Modules</span>
                              <p className="text-xs text-indigo-600 mt-0.5">Add content, assignments & discussions within modules</p>
                            </div>
                          </div>
                        </button>
                        <Link
                          href={`/instructor/courses/${course.id}/announcements`}
                          className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                            <span className="font-medium">Manage Announcements</span>
                          </div>
                        </Link>
                        <Link
                          href={`/instructor/courses/${course.id}/gradebook`}
                          className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <ClipboardList className="h-5 w-5 text-yellow-600 mr-3" />
                            <span className="font-medium">View Gradebook</span>
                          </div>
                        </Link>
                        <button
                          onClick={() => setActiveTab('students')}
                          className="block w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-blue-600 mr-3" />
                            <span className="font-medium">Manage Students</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                      <div className="text-gray-500 text-sm">
                        No recent activity to display.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'modules' && (
                <ModuleList courseId={course.id} />
              )}

              {activeTab === 'students' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Enrolled Students ({enrollments.length})</h3>
                    <button onClick={handleAddStudentClick} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Student
                    </button>
                  </div>
                  {enrollments.length === 0 ? (
                    <p className="text-gray-500">No students enrolled yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{enrollment.user.name}</h4>
                            <p className="text-sm text-gray-500">{enrollment.user.email}</p>
                          </div>
                          <button className="text-sm text-blue-600 hover:text-blue-500">
                            View Profile
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Course Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Course Status</h4>
                        <p className="text-sm text-gray-500">Make course visible to students</p>
                      </div>
                      <button
                        onClick={handleToggleCourseStatus}
                        disabled={isUpdatingStatus}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${course.isActive ? 'bg-blue-600' : 'bg-gray-200'} ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            course.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Add Student Modal */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Add Student to Course</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="mb-4">
                <label htmlFor="studentSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Student to Enroll</label>
                <div className="relative">
                  {isLoadingStudents ? (
                    <div className="flex items-center justify-center h-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500">Loading students...</span>
                    </div>
                  ) : (
                    <>
                      {allStudents.length === 0 ? (
                        <p className="text-sm text-gray-500 py-2">No students available for enrollment</p>
                      ) : (
                        <select
                          id="studentSelect"
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Select a student --</option>
                          {allStudents.map(student => (
                            <option key={student.id} value={student.id}>
                              {student.name} ({student.email})
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </div>
              </div>

              {enrollmentError && (
                <p className="text-sm text-red-600 mb-3">{enrollmentError}</p>
              )}

              <div className="text-right space-x-2">
                <button 
                  onClick={handleCloseModal} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEnrollStudent}
                  disabled={isEnrolling || !selectedStudentId || isLoadingStudents}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    isEnrolling || !selectedStudentId || isLoadingStudents 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isEnrolling ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}