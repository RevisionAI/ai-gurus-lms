'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Users, BookOpen, GraduationCap, Settings, BarChart3, Shield } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  totalCourses: number
  totalStudents: number
  totalInstructors: number
  totalEnrollments: number
  totalAssignments: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalEnrollments: 0,
    totalAssignments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Admin Dashboard
          </h1>
          <p className="text-text-secondary">Welcome back, {session?.user.name}! Manage the entire LMS system.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-accent-pink-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-white">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-blue-purple-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Students</dt>
                  <dd className="text-lg font-medium text-white">{stats.totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-orange-yellow-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Instructors</dt>
                  <dd className="text-lg font-medium text-white">{stats.totalInstructors}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-button-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Total Courses</dt>
                  <dd className="text-lg font-medium text-white">{stats.totalCourses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-pink-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Enrollments</dt>
                  <dd className="text-lg font-medium text-white">{stats.totalEnrollments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-accent-blue-purple-gradient text-text-on-dark-bg overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-white/80 truncate">Assignments</dt>
                  <dd className="text-lg font-medium text-white">{stats.totalAssignments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card-bg shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">Administrative Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/users"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <Users className="h-5 w-5 mr-2 text-pink-500" />
              Manage Users
            </Link>
            <Link
              href="/admin/courses"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <BookOpen className="h-5 w-5 mr-2 text-purple-500" />
              Manage Courses
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              System Reports
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <Settings className="h-5 w-5 mr-2 text-pink-500" />
              System Settings
            </Link>
            <Link
              href="/admin/security"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <Shield className="h-5 w-5 mr-2 text-purple-500" />
              Security Settings
            </Link>
            <Link
              href="/admin/backup"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content"
            >
              <Settings className="h-5 w-5 mr-2 text-blue-500" />
              Backup & Restore
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-card-bg shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-pink-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">New user registration</p>
                  <p className="text-sm text-text-secondary">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">New course created</p>
                  <p className="text-sm text-text-secondary">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">System backup completed</p>
                  <p className="text-sm text-text-secondary">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card-bg shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Database</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">API Response Time</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  &lt; 200ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Storage Usage</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  65% Used
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Active Sessions</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  24 Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}