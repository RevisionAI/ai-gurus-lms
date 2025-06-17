'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import StudentDashboard from '@/components/StudentDashboard'
import InstructorDashboard from '@/components/InstructorDashboard'
import AdminDashboard from '@/components/AdminDashboard'

export default function DashboardPage() {
  const { data: session } = useSession()

  const renderDashboard = () => {
    switch (session?.user.role) {
      case 'STUDENT':
        return <StudentDashboard />
      case 'INSTRUCTOR':
        return <InstructorDashboard />
      case 'ADMIN':
        return <AdminDashboard />
      default:
        return <div>Invalid role</div>
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {renderDashboard()}
        </main>
      </div>
    </ProtectedRoute>
  )
}