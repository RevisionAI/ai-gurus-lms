import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['INSTRUCTOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify course ownership (for instructors) or admin access
    const course = await prisma.courses.findFirst({
      where: {
        id: id,
        ...(session.user.role === 'INSTRUCTOR' ? { instructorId: session.user.id } : {}),
        ...notDeleted,
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const body = await request.json()
    const { moduleIds } = body

    if (!Array.isArray(moduleIds)) {
      return NextResponse.json(
        { error: 'moduleIds must be an array of module IDs' },
        { status: 400 }
      )
    }

    if (moduleIds.length === 0) {
      return NextResponse.json(
        { error: 'moduleIds array cannot be empty' },
        { status: 400 }
      )
    }

    // Verify all modules belong to this course and exist
    const existingModules = await prisma.modules.findMany({
      where: {
        id: { in: moduleIds },
        courseId: id,
        ...notDeleted,
      },
      select: { id: true },
    })

    const existingIds = new Set(existingModules.map((m) => m.id))
    const invalidIds = moduleIds.filter((mid: string) => !existingIds.has(mid))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid module IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Update orderIndex for each module based on array position
    await Promise.all(
      moduleIds.map(async (moduleId: string, index: number) => {
        await prisma.modules.update({
          where: { id: moduleId },
          data: { orderIndex: index },
        })
      })
    )

    // Return updated modules ordered by orderIndex
    const updatedModules = await prisma.modules.findMany({
      where: {
        courseId: id,
        ...notDeleted,
      },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        orderIndex: true,
        isPublished: true,
        requiresPrevious: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            course_content: { where: notDeleted },
            assignments: { where: notDeleted },
            discussions: { where: notDeleted },
          },
        },
      },
    })

    // Transform response to include counts at top level
    const response = updatedModules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.orderIndex,
      isPublished: module.isPublished,
      requiresPrevious: module.requiresPrevious,
      createdAt: module.createdAt.toISOString(),
      updatedAt: module.updatedAt.toISOString(),
      contentCount: module._count.course_content,
      assignmentCount: module._count.assignments,
      discussionCount: module._count.discussions,
    }))

    return NextResponse.json({ modules: response })
  } catch (error) {
    console.error('Error reordering modules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
