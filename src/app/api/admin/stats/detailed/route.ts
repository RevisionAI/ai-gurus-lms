/**
 * Admin Dashboard Detailed Statistics API
 *
 * Provides comprehensive system statistics for the admin dashboard including:
 * - User counts by role (students, instructors, admins)
 * - Course counts (active, inactive)
 * - Enrollment, assignment, and discussion totals
 * - 24-hour activity metrics (recent logins, enrollments, submissions)
 * - System health indicators (database, storage status)
 * - Time-series enrollment data (last 30 days)
 * - Course completion rates (top 10)
 *
 * Features:
 * - Redis caching with 5-minute TTL for performance
 * - Parallel query execution using Promise.all
 * - Soft delete filtering on all applicable models
 * - Admin-only authorization
 *
 * @endpoint GET /api/admin/stats/detailed
 * @auth Required - Admin role only
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCached, setCached, CACHE_KEYS, getStatsCacheTTL } from '@/lib/redis'

// ============================================
// Types
// ============================================

export interface UserStats {
  total: number
  students: number
  instructors: number
  admins: number
}

export interface CourseStats {
  total: number
  active: number
  inactive: number
}

export interface AssignmentStats {
  total: number
  submissions: number
}

export interface DiscussionStats {
  total: number
  posts: number
}

export interface RecentActivity {
  logins: number
  enrollments: number
  submissions: number
  timestamp: string
}

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down'
  storage: 'healthy' | 'degraded' | 'down'
  lastChecked: string
}

export interface EnrollmentOverTime {
  date: string
  count: number
}

export interface CourseCompletionRate {
  courseId: string
  courseTitle: string
  rate: number
}

export interface SystemStats {
  users: UserStats
  courses: CourseStats
  enrollments: number
  assignments: AssignmentStats
  discussions: DiscussionStats
  recentActivity: RecentActivity
  systemHealth: SystemHealth
  enrollmentsOverTime: EnrollmentOverTime[]
  completionRates: CourseCompletionRate[]
}

// ============================================
// Statistics Aggregation Functions
// ============================================

/**
 * Aggregate user statistics by role
 * Filters out soft-deleted users
 */
async function aggregateUserStats(): Promise<UserStats> {
  const roleGroups = await prisma.users.groupBy({
    by: ['role'],
    where: { deletedAt: null },
    _count: true,
  })

  const counts = {
    STUDENT: 0,
    INSTRUCTOR: 0,
    ADMIN: 0,
  }

  roleGroups.forEach((group) => {
    counts[group.role] = group._count
  })

  return {
    total: counts.STUDENT + counts.INSTRUCTOR + counts.ADMIN,
    students: counts.STUDENT,
    instructors: counts.INSTRUCTOR,
    admins: counts.ADMIN,
  }
}

/**
 * Aggregate course statistics by active status
 * Filters out soft-deleted courses
 */
async function aggregateCourseStats(): Promise<CourseStats> {
  const statusGroups = await prisma.courses.groupBy({
    by: ['isActive'],
    where: { deletedAt: null },
    _count: true,
  })

  let active = 0
  let inactive = 0

  statusGroups.forEach((group) => {
    if (group.isActive) {
      active = group._count
    } else {
      inactive = group._count
    }
  })

  return {
    total: active + inactive,
    active,
    inactive,
  }
}

/**
 * Get total enrollment count
 * Enrollments don't have soft delete
 */
async function getEnrollmentCount(): Promise<number> {
  return prisma.enrollments.count()
}

/**
 * Aggregate assignment and submission statistics
 * Filters soft-deleted assignments
 */
async function aggregateAssignmentStats(): Promise<AssignmentStats> {
  const [assignmentCount, submissionCount] = await Promise.all([
    prisma.assignments.count({ where: { deletedAt: null } }),
    prisma.submissions.count(),
  ])

  return {
    total: assignmentCount,
    submissions: submissionCount,
  }
}

/**
 * Aggregate discussion and post statistics
 * Filters soft-deleted discussions
 */
async function aggregateDiscussionStats(): Promise<DiscussionStats> {
  const [discussionCount, postCount] = await Promise.all([
    prisma.discussions.count({ where: { deletedAt: null } }),
    prisma.discussion_posts.count(),
  ])

  return {
    total: discussionCount,
    posts: postCount,
  }
}

/**
 * Calculate 24-hour activity metrics
 */
async function calculateRecentActivity(): Promise<RecentActivity> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [recentLogins, recentEnrollments, recentSubmissions] = await Promise.all([
    // Recent logins approximated by updatedAt (actual login tracking would need separate table)
    prisma.users.count({
      where: {
        deletedAt: null,
        updatedAt: { gte: twentyFourHoursAgo },
      },
    }),
    prisma.enrollments.count({
      where: { enrolledAt: { gte: twentyFourHoursAgo } },
    }),
    prisma.submissions.count({
      where: { submittedAt: { gte: twentyFourHoursAgo } },
    }),
  ])

  return {
    logins: recentLogins,
    enrollments: recentEnrollments,
    submissions: recentSubmissions,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Check system health (database and storage connectivity)
 */
async function checkSystemHealth(): Promise<SystemHealth> {
  let databaseStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
  let storageStatus: 'healthy' | 'degraded' | 'down' = 'healthy'

  // Database health check
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    console.error('Database health check failed:', error)
    databaseStatus = 'down'
  }

  // Storage health check (R2)
  // For now, assume healthy if configured
  // A more robust check would ping the R2 endpoint
  const r2Configured = !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )

  if (!r2Configured) {
    storageStatus = 'degraded'
  }

  return {
    database: databaseStatus,
    storage: storageStatus,
    lastChecked: new Date().toISOString(),
  }
}

/**
 * Get enrollments grouped by date for the last 30 days
 */
async function getEnrollmentsOverTime(): Promise<EnrollmentOverTime[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Use raw query for efficient date grouping
  const results = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
    SELECT
      DATE("enrolledAt") as date,
      COUNT(*) as count
    FROM enrollments
    WHERE "enrolledAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("enrolledAt")
    ORDER BY date ASC
  `

  return results.map((row) => ({
    date: row.date.toISOString().split('T')[0],
    count: Number(row.count),
  }))
}

/**
 * Calculate completion rates for top 10 courses
 * Completion rate = (grades count) / (enrollments * assignments) * 100
 */
async function calculateCompletionRates(): Promise<CourseCompletionRate[]> {
  const coursesWithStats = await prisma.courses.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          enrollments: true,
          assignments: {
            where: { deletedAt: null },
          },
        },
      },
      assignments: {
        where: { deletedAt: null },
        select: {
          _count: {
            select: {
              grades: {
                where: { deletedAt: null },
              },
            },
          },
        },
      },
    },
  })

  const completionRates = coursesWithStats
    .map((course) => {
      const enrolledStudents = course._count.enrollments
      const totalAssignments = course._count.assignments
      const totalPossibleGrades = totalAssignments * enrolledStudents

      const totalGrades = course.assignments.reduce(
        (sum, assignment) => sum + assignment._count.grades,
        0
      )

      const rate =
        totalPossibleGrades > 0
          ? (totalGrades / totalPossibleGrades) * 100
          : 0

      return {
        courseId: course.id,
        courseTitle: course.title,
        rate: Math.round(rate * 100) / 100, // Round to 2 decimals
      }
    })
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10) // Top 10 courses

  return completionRates
}

/**
 * Aggregate all system statistics
 */
async function aggregateStatistics(): Promise<SystemStats> {
  // Execute all aggregations in parallel for performance
  const [
    users,
    courses,
    enrollments,
    assignments,
    discussions,
    recentActivity,
    systemHealth,
    enrollmentsOverTime,
    completionRates,
  ] = await Promise.all([
    aggregateUserStats(),
    aggregateCourseStats(),
    getEnrollmentCount(),
    aggregateAssignmentStats(),
    aggregateDiscussionStats(),
    calculateRecentActivity(),
    checkSystemHealth(),
    getEnrollmentsOverTime(),
    calculateCompletionRates(),
  ])

  return {
    users,
    courses,
    enrollments,
    assignments,
    discussions,
    recentActivity,
    systemHealth,
    enrollmentsOverTime,
    completionRates,
  }
}

// ============================================
// API Handler
// ============================================

/**
 * GET /api/admin/stats/detailed
 *
 * Returns comprehensive system statistics for the admin dashboard.
 * Results are cached in Redis for 5 minutes (300 seconds).
 *
 * @requires Admin authentication
 * @returns {SystemStats} Complete system statistics
 */
export async function GET() {
  try {
    // Authorization check
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    // Check cache first
    const cached = await getCached<SystemStats>(CACHE_KEYS.ADMIN_STATS_DETAILED)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=60',
        },
      })
    }

    // Fetch fresh statistics
    const stats = await aggregateStatistics()

    // Cache the results
    await setCached(CACHE_KEYS.ADMIN_STATS_DETAILED, stats, getStatsCacheTTL())

    return NextResponse.json(stats, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=60',
      },
    })
  } catch (error) {
    console.error('Error fetching detailed admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    )
  }
}
