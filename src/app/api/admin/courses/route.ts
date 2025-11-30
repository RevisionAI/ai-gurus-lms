/**
 * Admin Course Management API - List and Create Courses
 *
 * GET  /api/admin/courses - List all courses with pagination, search, and filtering
 * POST /api/admin/courses - Create a new course (assign to any instructor)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { invalidateAdminStats } from '@/lib/redis'
import { createCourseSchema } from '@/validators/course'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// ============================================
// Query Parameter Schema
// ============================================

const courseSearchSchema = z.object({
  search: z.string().optional(),
  instructorId: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// Extended schema for admin course creation (includes instructorId)
const adminCreateCourseSchema = createCourseSchema.extend({
  instructorId: z.string().min(1, 'Instructor ID is required'),
})

// ============================================
// GET - List All Courses
// ============================================

export async function GET(request: NextRequest) {
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
      '/api/admin/courses'
    )
    if (rateLimitResponse) return rateLimitResponse

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      search: searchParams.get('search') || undefined,
      instructorId: searchParams.get('instructorId') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    }

    const validation = courseSearchSchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { search, instructorId, isActive, page, limit } = validation.data

    // Build where clause
    const where: Prisma.coursesWhereInput = {
      ...notDeleted,
      ...(instructorId && { instructorId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    // Fetch courses and total count in parallel
    const [courses, total] = await Promise.all([
      prisma.courses.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              assignments: { where: notDeleted },
              modules: { where: notDeleted },
              course_content: { where: notDeleted },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.courses.count({ where }),
    ])

    // Transform to include instructor info at top level
    const transformedCourses = courses.map((course) => ({
      ...course,
      instructor: course.users,
      users: undefined,
    }))

    return NextResponse.json({
      data: transformedCourses,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch courses' } },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create Course
// ============================================

export async function POST(request: NextRequest) {
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
      '/api/admin/courses'
    )
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()

    // Validate with extended schema (includes instructorId)
    const validation = adminCreateCourseSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      code,
      semester,
      year,
      isActive,
      prerequisites,
      learningObjectives,
      targetAudience,
      instructorId,
    } = validation.data

    // Verify instructor exists and is an instructor
    const instructor = await prisma.users.findFirst({
      where: {
        id: instructorId,
        role: 'INSTRUCTOR',
        ...notDeleted,
      },
    })

    if (!instructor) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INSTRUCTOR',
            message: 'Instructor not found or user is not an instructor',
          },
        },
        { status: 400 }
      )
    }

    // Check if course code already exists
    const existingCourse = await prisma.courses.findUnique({
      where: { code },
    })

    if (existingCourse) {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_CODE',
            message: 'Course code already exists',
          },
        },
        { status: 409 }
      )
    }

    const course = await prisma.courses.create({
      data: {
        id: randomUUID(),
        title,
        description,
        code,
        semester,
        year,
        isActive,
        prerequisites,
        learningObjectives,
        targetAudience,
        instructorId,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    })

    // Log course creation
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_course_created',
        courseId: course.id,
        courseCode: course.code,
        instructorId,
        createdBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json(
      {
        data: {
          ...course,
          instructor: course.users,
          users: undefined,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create course' } },
      { status: 500 }
    )
  }
}
