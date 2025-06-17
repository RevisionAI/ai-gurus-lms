'use client'

import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useParams } from 'next/navigation'

export default function CourseAssignmentsPage() {
  const params = useParams()
  const courseId = params.id

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-2xl font-semibold text-gray-900">
              Manage Assignments for Course {courseId ? `(${courseId})` : ''}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              This is the page for managing assignments for a specific course. Functionality to be implemented.
            </p>
            {/* Add UI for listing, creating, editing, deleting assignments for this course */}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
