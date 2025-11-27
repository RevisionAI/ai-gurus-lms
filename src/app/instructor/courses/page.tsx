'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Breadcrumb, { BreadcrumbItem, generateBreadcrumbs } from '@/components/Breadcrumb'
import { PlusCircle, BookOpen, Users, FileText } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  code: string
  semester: string
  year: number
  _count: {
    enrollments: number
    assignments: number
  }
}

export default function InstructorCoursesPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const breadcrumbs = generateBreadcrumbs.custom([
    { label: 'Dashboard', href: '/instructor/dashboard' }, // Assuming a dashboard exists
    { label: 'My Courses' }
  ])

  useEffect(() => {
    const fetchCourses = async () => {
      if (session?.user.role === 'INSTRUCTOR') {
        try {
          setLoading(true)
          const response = await fetch('/api/instructor/courses')
          if (!response.ok) {
            throw new Error('Failed to fetch courses')
          }
          const data = await response.json()
          setCourses(data)
          setError(null)
        } catch (err: unknown) {
          console.error('Error fetching courses:', err)
          setError(err instanceof Error ? err.message : 'An unknown error occurred')
        } finally {
          setLoading(false)
        }
      }
    }

    if (session) { // Fetch courses once session is available
        fetchCourses()
    }
  }, [session])

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbs} />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Courses</h1>
          <Link href="/instructor/courses/new" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150">
            <PlusCircle size={20} className="mr-2" />
            Create New Course
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 mb-2">No courses found.</p>
            <p className="text-gray-500">Get started by creating your first course!</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Link key={course.id} href={`/instructor/courses/${course.id}`} className="block">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out h-full flex flex-col">
                  <div className="p-6 flex-grow">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={course.title}>{course.title}</h2>
                    <p className="text-sm text-gray-500 mb-1">{course.code}</p>
                    <p className="text-sm text-gray-500 mb-4">{course.semester} {course.year}</p>
                    {course.description && <p className="text-gray-600 text-sm mb-4 line-clamp-3" title={course.description}>{course.description}</p>}
                  </div>
                  <div className="bg-gray-50 p-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users size={16} className="mr-1.5 text-blue-500" />
                        <span>{course._count.enrollments} Student{course._count.enrollments !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText size={16} className="mr-1.5 text-green-500" />
                        <span>{course._count.assignments} Assignment{course._count.assignments !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  )
}
