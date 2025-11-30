/**
 * Admin Assignment Management API - Individual Assignment Operations
 *
 * GET    /api/admin/courses/[id]/assignments/[assignmentId] - Get assignment details
 * PUT    /api/admin/courses/[id]/assignments/[assignmentId] - Update assignment
 * DELETE /api/admin/courses/[id]/assignments/[assignmentId] - Soft delete assignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted, softDelete } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { invalidateAdminStats } from '@/lib/redis'
import { z } from 'zod'

// Assignment update schema
const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  maxPoints: z.number().int().min(0).max(1000).optional(),
  isPublished: z.boolean().optional(),
  moduleId: z.string().optional().nullable(),
})

// ============================================
// GET - Get Assignment Details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
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

    const { id: courseId, assignmentId } = await params

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

    // Fetch the assignment with full details
    const assignment = await prisma.assignments.findFirst({
      where: {
        id: assignmentId,
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
            email: true,
          },
        },
        courses: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            grades: { where: notDeleted },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        isPublished: assignment.isPublished,
        moduleId: assignment.moduleId,
        module: assignment.modules,
        createdBy: assignment.users,
        course: assignment.courses,
        submissionCount: assignment._count.submissions,
        gradeCount: assignment._count.grades,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assignment' } },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update Assignment
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
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

    const { id: courseId, assignmentId } = await params

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
    const validation = updateAssignmentSchema.safeParse(body)
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

    // Check if assignment exists
    const existingAssignment = await prisma.assignments.findFirst({
      where: {
        id: assignmentId,
        courseId,
        ...notDeleted,
      },
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Assignment not found' } },
        { status: 404 }
      )
    }

    const { title, description, dueDate, maxPoints, isPublished, moduleId } = validation.data

    // If moduleId provided, verify it exists and belongs to course
    if (moduleId !== undefined && moduleId !== null) {
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

    // Build update data
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (maxPoints !== undefined) updateData.maxPoints = maxPoints
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (moduleId !== undefined) updateData.moduleId = moduleId

    const updatedAssignment = await prisma.assignments.update({
      where: { id: assignmentId },
      data: updateData,
    })

    // Log assignment update
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_assignment_updated',
        assignmentId,
        courseId,
        updatedFields: Object.keys(updateData).filter((k) => k !== 'updatedAt'),
        updatedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({ data: updatedAssignment })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update assignment' } },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Soft Delete Assignment
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
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

    const { id: courseId, assignmentId } = await params

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

    // Check if assignment exists
    const assignment = await prisma.assignments.findFirst({
      where: {
        id: assignmentId,
        courseId,
        ...notDeleted,
      },
      select: {
        id: true,
        title: true,
        moduleId: true,
        _count: {
          select: {
            submissions: true,
            grades: { where: notDeleted },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Assignment not found or already deleted' } },
        { status: 404 }
      )
    }

    // Soft delete assignment (grades are cascade deleted by soft-delete utility)
    await softDelete(prisma.assignments, assignmentId)

    // Also soft delete related grades
    await prisma.grades.updateMany({
      where: {
        assignmentId,
        ...notDeleted,
      },
      data: { deletedAt: new Date() },
    })

    // Log assignment deletion
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_assignment_deleted',
        assignmentId,
        courseId,
        assignmentTitle: assignment.title,
        submissionCount: assignment._count.submissions,
        gradeCount: assignment._count.grades,
        deletedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({
      message: 'Assignment archived successfully',
      archivedGrades: assignment._count.grades,
    })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete assignment' } },
      { status: 500 }
    )
  }
}
