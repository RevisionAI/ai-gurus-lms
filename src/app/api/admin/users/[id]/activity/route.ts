/**
 * Admin User Management API - User Activity Log
 *
 * GET /api/admin/users/[id]/activity - Get user's recent activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface Activity {
  type: 'enrollment' | 'submission' | 'grade_received' | 'grade_given'
  description: string
  timestamp: Date
  details?: Record<string, string>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    // Admin-only access
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    // Apply rate limiting
    const rateLimitResponse = await applyUserRateLimit(
      session.user.id,
      '/api/admin/users/[id]/activity'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Verify user exists
    const user = await prisma.users.findFirst({
      where: { id, ...notDeleted },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Get date 30 days ago for activity window
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch activities from different sources
    const activities: Activity[] = []

    // 1. Recent enrollments
    const enrollments = await prisma.enrollments.findMany({
      where: {
        userId: id,
        enrolledAt: { gte: thirtyDaysAgo },
      },
      include: {
        courses: { select: { title: true, code: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    for (const enrollment of enrollments) {
      activities.push({
        type: 'enrollment',
        description: `Enrolled in ${enrollment.courses.title}`,
        timestamp: enrollment.enrolledAt,
        details: { courseCode: enrollment.courses.code },
      })
    }

    // 2. Recent submissions
    const submissions = await prisma.submissions.findMany({
      where: {
        studentId: id,
        submittedAt: { gte: thirtyDaysAgo },
      },
      include: {
        assignments: {
          select: {
            title: true,
            courses: { select: { title: true, code: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    for (const submission of submissions) {
      activities.push({
        type: 'submission',
        description: `Submitted ${submission.assignments.title}`,
        timestamp: submission.submittedAt,
        details: {
          courseTitle: submission.assignments.courses.title,
          courseCode: submission.assignments.courses.code,
        },
      })
    }

    // 3. Grades received (as student)
    const gradesReceived = await prisma.grades.findMany({
      where: {
        studentId: id,
        gradedAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      include: {
        assignments: {
          select: {
            title: true,
            maxPoints: true,
            courses: { select: { title: true } },
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
    })

    for (const grade of gradesReceived) {
      activities.push({
        type: 'grade_received',
        description: `Received grade on ${grade.assignments.title}: ${grade.points}/${grade.assignments.maxPoints}`,
        timestamp: grade.gradedAt,
        details: { courseTitle: grade.assignments.courses.title },
      })
    }

    // 4. Grades given (if user is instructor)
    if (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') {
      const gradesGiven = await prisma.grades.findMany({
        where: {
          gradedById: id,
          gradedAt: { gte: thirtyDaysAgo },
          deletedAt: null,
        },
        include: {
          users_grades_studentIdTousers: { select: { name: true, surname: true } },
          assignments: {
            select: {
              title: true,
              courses: { select: { title: true } },
            },
          },
        },
        orderBy: { gradedAt: 'desc' },
      })

      for (const grade of gradesGiven) {
        activities.push({
          type: 'grade_given',
          description: `Graded ${grade.users_grades_studentIdTousers.name} ${grade.users_grades_studentIdTousers.surname} on ${grade.assignments.title}`,
          timestamp: grade.gradedAt,
          details: { courseTitle: grade.assignments.courses.title },
        })
      }
    }

    // Sort all activities by timestamp (descending)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Paginate
    const total = activities.length
    const paginatedActivities = activities.slice((page - 1) * limit, page * limit)

    return NextResponse.json({
      data: paginatedActivities,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch activity' } },
      { status: 500 }
    )
  }
}
