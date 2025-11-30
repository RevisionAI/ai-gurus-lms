/**
 * Admin Course Management API - Individual Course Operations
 *
 * GET    /api/admin/courses/[id] - Get course details
 * PUT    /api/admin/courses/[id] - Update course
 * DELETE /api/admin/courses/[id] - Soft delete course
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cascadeSoftDeleteCourse, notDeleted } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { invalidateAdminStats } from '@/lib/redis'
import { z } from 'zod'

// Admin update schema with all course fields plus instructorId
const adminUpdateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().max(5000).optional().nullable(),
  semester: z.string().min(1).max(50).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  isActive: z.boolean().optional(),
  instructorId: z.string().min(1).optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'At least one field must be provided for update' }
)

// ============================================
// GET - Get Course Details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    // Admin-only access
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    const course = await prisma.courses.findFirst({
      where: {
        id,
        ...notDeleted,
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
        _count: {
          select: {
            enrollments: true,
            assignments: { where: notDeleted },
            discussions: { where: notDeleted },
            announcements: { where: notDeleted },
            course_content: { where: notDeleted },
            modules: { where: notDeleted },
          },
        },
        modules: {
          where: notDeleted,
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            orderIndex: true,
            isPublished: true,
            _count: {
              select: {
                course_content: { where: notDeleted },
                assignments: { where: notDeleted },
              },
            },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        ...course,
        instructor: course.users,
        users: undefined,
      },
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch course' } },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update Course
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()

    // Validate with extended schema
    const validation = adminUpdateCourseSchema.safeParse(body)
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

    const course = await prisma.courses.findFirst({
      where: {
        id,
        ...notDeleted,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
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
    } = validation.data as {
      title?: string
      description?: string | null
      code?: string
      semester?: string
      year?: number
      isActive?: boolean
      prerequisites?: string | null
      learningObjectives?: string[]
      targetAudience?: string | null
      instructorId?: string
    }

    // If changing instructor, verify new instructor exists and is an instructor
    if (instructorId && instructorId !== course.instructorId) {
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
    }

    // Check if course code is being changed and if it already exists
    if (code && code !== course.code) {
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
    }

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (code !== undefined) updateData.code = code
    if (semester !== undefined) updateData.semester = semester
    if (year !== undefined) updateData.year = year
    if (isActive !== undefined) updateData.isActive = isActive
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites
    if (learningObjectives !== undefined) updateData.learningObjectives = learningObjectives
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience
    if (instructorId !== undefined) updateData.instructorId = instructorId

    const updatedCourse = await prisma.courses.update({
      where: { id },
      data: updateData,
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

    // Log course update
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_course_updated',
        courseId: id,
        updatedFields: Object.keys(updateData).filter((k) => k !== 'updatedAt'),
        updatedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({
      data: {
        ...updatedCourse,
        instructor: updatedCourse.users,
        users: undefined,
      },
    })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update course' } },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Soft Delete Course
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const course = await prisma.courses.findFirst({
      where: {
        id,
        ...notDeleted,
      },
      select: {
        id: true,
        title: true,
        code: true,
        instructorId: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found or already deleted' } },
        { status: 404 }
      )
    }

    // Soft delete course and cascade to related content
    await cascadeSoftDeleteCourse(id)

    // Log course deletion
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_course_deleted',
        courseId: id,
        courseCode: course.code,
        courseTitle: course.title,
        originalInstructorId: course.instructorId,
        deletedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({
      message: 'Course and related content archived successfully',
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete course' } },
      { status: 500 }
    )
  }
}
