/**
 * Move Content API Endpoint
 * PUT /api/instructor/courses/[id]/content/[contentId]/move
 *
 * Moves content to a different module within the same course
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['INSTRUCTOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: courseId, contentId } = await params

    // Verify course ownership (for instructors) or admin access
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        ...(session.user.role === 'INSTRUCTOR' ? { instructorId: session.user.id } : {}),
        ...notDeleted,
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { targetModuleId } = body

    if (!targetModuleId) {
      return NextResponse.json(
        { error: 'targetModuleId is required' },
        { status: 400 }
      )
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

    // Verify content exists and belongs to this course
    const existingContent = await prisma.course_content.findFirst({
      where: {
        id: contentId,
        courseId: courseId,
        ...notDeleted,
      },
    })

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Check if content is already in target module
    if (existingContent.moduleId === targetModuleId) {
      return NextResponse.json(
        { error: 'Content is already in this module' },
        { status: 400 }
      )
    }

    // Get the next order index in the target module
    const lastContentInTarget = await prisma.course_content.findFirst({
      where: {
        moduleId: targetModuleId,
        courseId: courseId,
        ...notDeleted,
      },
      orderBy: { orderIndex: 'desc' },
    })

    const newOrderIndex = (lastContentInTarget?.orderIndex ?? -1) + 1

    // Update content to new module
    const updatedContent = await prisma.course_content.update({
      where: { id: contentId },
      data: {
        moduleId: targetModuleId,
        orderIndex: newOrderIndex,
      },
    })

    return NextResponse.json({
      content: updatedContent,
      message: 'Content moved successfully',
    })
  } catch (error) {
    console.error('Error moving content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
