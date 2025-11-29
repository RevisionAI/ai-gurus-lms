/**
 * Move Assignment API Endpoint
 * Story 4.3: Assignment Creation in Module Context (AC-4)
 *
 * PUT /api/instructor/courses/[id]/assignments/[assignmentId]/move
 * Moves an assignment to a different module
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId, assignmentId } = await params
    const { targetModuleId } = await request.json()

    if (!targetModuleId) {
      return NextResponse.json(
        { error: 'Target module ID is required' },
        { status: 400 }
      )
    }

    // Verify course exists and belongs to this instructor (or user is admin)
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        ...(session.user.role === 'ADMIN' ? {} : { instructorId: session.user.id }),
        ...notDeleted,
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify assignment exists and belongs to this course
    const assignment = await prisma.assignments.findFirst({
      where: {
        id: assignmentId,
        courseId: courseId,
        ...notDeleted,
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify target module exists and belongs to this course
    const targetModule = await prisma.modules.findFirst({
      where: {
        id: targetModuleId,
        courseId: courseId,
        ...notDeleted,
      },
    })

    if (!targetModule) {
      return NextResponse.json(
        { error: 'Target module not found' },
        { status: 404 }
      )
    }

    // Check if already in target module
    if (assignment.moduleId === targetModuleId) {
      return NextResponse.json(
        { error: 'Assignment is already in this module' },
        { status: 400 }
      )
    }

    // Move the assignment
    const updatedAssignment = await prisma.assignments.update({
      where: { id: assignmentId },
      data: { moduleId: targetModuleId },
      include: {
        modules: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Assignment moved successfully',
      assignment: updatedAssignment,
    })
  } catch (error) {
    console.error('Error moving assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
