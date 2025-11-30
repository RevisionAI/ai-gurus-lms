/**
 * AdminDashboard Component
 *
 * Main admin dashboard page displaying comprehensive system statistics including:
 * - Overview stats (users, courses, enrollments, assignments, discussions)
 * - 24-hour activity feed
 * - System health indicators
 * - Enrollment trends chart (30 days)
 * - Course completion rates chart (top 10)
 * - Quick action links to admin management pages
 *
 * Features:
 * - Manual refresh button
 * - Auto-refresh toggle (5-minute interval matching cache TTL)
 * - Last updated timestamp display
 * - Loading states with Suspense boundaries
 * - Error handling with user feedback
 * - Responsive grid layout
 *
 * @component
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Shield,
  Trash2,
  RefreshCw,
  Clock,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

// Dashboard Components
import { StatsOverview } from '@/components/admin/StatsOverview'
import { ActivityFeed } from '@/components/admin/ActivityFeed'
import { SystemHealth } from '@/components/admin/SystemHealth'
import { EnrollmentChart } from '@/components/admin/EnrollmentChart'
import { CompletionRateChart } from '@/components/admin/CompletionRateChart'

// ============================================
// Types
// ============================================

interface UserStats {
  total: number
  students: number
  instructors: number
  admins: number
}

interface CourseStats {
  total: number
  active: number
  inactive: number
}

interface AssignmentStats {
  total: number
  submissions: number
}

interface DiscussionStats {
  total: number
  posts: number
}

interface RecentActivity {
  logins: number
  enrollments: number
  submissions: number
  timestamp: string
}

interface SystemHealthData {
  database: 'healthy' | 'degraded' | 'down'
  storage: 'healthy' | 'degraded' | 'down'
  lastChecked: string
}

interface EnrollmentOverTime {
  date: string
  count: number
}

interface CourseCompletionRate {
  courseId: string
  courseTitle: string
  rate: number
}

interface SystemStats {
  users: UserStats
  courses: CourseStats
  enrollments: number
  assignments: AssignmentStats
  discussions: DiscussionStats
  recentActivity: RecentActivity
  systemHealth: SystemHealthData
  enrollmentsOverTime: EnrollmentOverTime[]
  completionRates: CourseCompletionRate[]
}

// ============================================
// Auto-refresh interval (matches cache TTL)
// ============================================

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

// ============================================
// Main Component
// ============================================

export default function AdminDashboard() {
  const { data: session } = useSession()

  // State
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fetch statistics from API
  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    }

    try {
      const response = await fetch('/api/admin/stats/detailed')

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in again')
        }
        if (response.status === 403) {
          throw new Error('Access denied - Admin privileges required')
        }
        throw new Error('Failed to fetch statistics')
      }

      const data: SystemStats = await response.json()
      setStats(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(() => {
      fetchStats(true)
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [autoRefresh, fetchStats])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchStats(true)
  }

  // Toggle auto-refresh
  const handleToggleAutoRefresh = () => {
    setAutoRefresh((prev) => !prev)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
        <span className="sr-only">Loading dashboard statistics...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Error Loading Dashboard
        </h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchStats()}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>
    )
  }

  // No data state
  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" role="alert">
        <p className="text-yellow-800">No statistics data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-card-bg overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                System Dashboard
              </h1>
              <p className="text-text-secondary">
                Welcome back, {session?.user.name}! Monitor platform health and usage.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              {/* Last Updated */}
              {lastUpdated && (
                <div
                  className="text-xs text-text-secondary flex items-center"
                  title={format(lastUpdated, 'PPpp')}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </div>
              )}

              {/* Auto-refresh Toggle */}
              <label className="flex items-center cursor-pointer">
                <span className="text-xs text-text-secondary mr-2">Auto-refresh</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoRefresh}
                    onChange={handleToggleAutoRefresh}
                    aria-label="Toggle auto-refresh"
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors ${
                      autoRefresh ? 'bg-pink-500' : 'bg-gray-300'
                    }`}
                  />
                  <div
                    className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-5' : ''
                    }`}
                  />
                </div>
              </label>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={refreshing ? 'Refreshing...' : 'Refresh dashboard data'}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview - Full Width */}
      <StatsOverview
        users={stats.users}
        courses={stats.courses}
        enrollments={stats.enrollments}
        assignments={stats.assignments}
        discussions={stats.discussions}
      />

      {/* Charts Section - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnrollmentChart data={stats.enrollmentsOverTime} />
        <CompletionRateChart data={stats.completionRates} />
      </div>

      {/* Activity and Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activity={stats.recentActivity} />
        <SystemHealth health={stats.systemHealth} />
      </div>

      {/* Administrative Actions */}
      <section className="bg-card-bg shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-text-primary mb-4">
            Administrative Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/users"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <Users className="h-5 w-5 mr-2 text-pink-500" />
              Manage Users
            </Link>
            <Link
              href="/admin/courses"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <BookOpen className="h-5 w-5 mr-2 text-purple-500" />
              Manage Courses
            </Link>
            <Link
              href="/admin/deleted-records"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <Trash2 className="h-5 w-5 mr-2 text-gray-500" />
              Deleted Records
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-md shadow-sm bg-card-bg text-sm font-medium text-text-primary hover:bg-bg-content transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Reports
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
