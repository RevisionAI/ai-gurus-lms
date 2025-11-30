/**
 * Admin Assignment Management API - List and Create Assignments
 *
 * GET  /api/admin/courses/[id]/assignments - List all assignments for a course
 * POST /api/admin/courses/[id]/assignments - Create new assignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { invalidateAdminStats } from '@/lib/redis'
import { z } from 'zod'

// Assignment validation schema
const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  maxPoints: z.number().int().min(0).max(1000).default(100),
  isPublished: z.boolean().default(false),
  moduleId: z.string().optional().nullable(),
})

// ============================================
// GET - List All Assignments for a Course
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

    const { id: courseId } = await params

    // Verify course exists
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        ...notDeleted,
      },
      select: {
        id: true,
        title: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    // Fetch assignments with related info
    const assignments = await prisma.assignments.findMany({
      where: {
        courseId,
        ...notDeleted,
      },
      include: {
        modules: {
          select: {
            id: true,
            title: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            grades: { where: notDeleted },
          },
        },
      },
      orderBy: [
        { moduleId: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Transform to include createdBy at top level
    const transformedAssignments = assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      maxPoints: assignment.maxPoints,
      isPublished: assignment.isPublished,
      moduleId: assignment.moduleId,
      module: assignment.modules,
      createdBy: assignment.users,
      submissionCount: assignment._count.submissions,
      gradeCount: assignment._count.grades,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }))

    return NextResponse.json({
      data: transformedAssignments,
      course: {
        id: course.id,
        title: course.title,
      },
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assignments' } },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create Assignment
// ============================================

export async function POST(
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
      '/api/admin/courses/assignments'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id: courseId } = await params

    // Verify course exists
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        ...notDeleted,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = createAssignmentSchema.safeParse(body)
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

    const { title, description, dueDate, maxPoints, isPublished, moduleId } = validation.data

    // If moduleId provided, verify it exists and belongs to course
    if (moduleId) {
      const targetModule = await prisma.modules.findFirst({
        where: {
          id: moduleId,
          courseId,
          ...notDeleted,
        },
      })

      if (!targetModule) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Module not found' } },
          { status: 404 }
        )
      }
    }

    const newAssignment = await prisma.assignments.create({
      data: {
        id: randomUUID(),
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxPoints,
        isPublished,
        courseId,
        moduleId: moduleId || null,
        createdById: session.user.id,
        updatedAt: new Date(),
      },
    })

    // Log assignment creation
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_assignment_created',
        assignmentId: newAssignment.id,
        courseId,
        moduleId: moduleId || null,
        createdBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({ data: newAssignment }, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create assignment' } },
      { status: 500 }
    )
  }
}
