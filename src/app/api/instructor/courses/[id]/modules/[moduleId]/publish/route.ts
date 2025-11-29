/**
 * Module Publish/Unpublish API Endpoint
 * PUT /api/instructor/courses/[id]/modules/[moduleId]/publish
 *
 * Publishes or unpublishes a module, with optional cascade to content
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['INSTRUCTOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId, moduleId } = await params

    // Verify course ownership (for instructors) or admin access
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        ...(session.user.role === 'INSTRUCTOR' ? { instructorId: session.user.id } : {}),
        ...notDeleted,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify module exists and belongs to this course
    const existingModule = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId: courseId,
        ...notDeleted,
      },
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { isPublished, cascadeToContent = false } = body

    if (typeof isPublished !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublished must be a boolean' },
        { status: 400 }
      )
    }

    // Update module
    const updatedModule = await prisma.modules.update({
      where: { id: moduleId },
      data: { isPublished },
    })

    let cascadedCount = 0

    // If cascading to content (only applies when publishing)
    if (cascadeToContent && isPublished) {
      // Update content
      const contentResult = await prisma.course_content.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: { isPublished: true },
      })
      cascadedCount += contentResult.count

      // Update assignments
      const assignmentResult = await prisma.assignments.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: { isPublished: true },
      })
      cascadedCount += assignmentResult.count
    }

    return NextResponse.json({
      module: {
        id: updatedModule.id,
        title: updatedModule.title,
        description: updatedModule.description,
        orderIndex: updatedModule.orderIndex,
        isPublished: updatedModule.isPublished,
        requiresPrevious: updatedModule.requiresPrevious,
        createdAt: updatedModule.createdAt,
        updatedAt: updatedModule.updatedAt,
      },
      cascadedCount,
      enrolledCount: course._count.enrollments,
    })
  } catch (error) {
    console.error('Error publishing module:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
