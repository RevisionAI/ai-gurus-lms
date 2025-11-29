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
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify module exists and belongs to course
    const courseModule = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId: courseId,
        ...notDeleted,
      },
    })

    if (!courseModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    const body = await request.json()
    const { contentIds } = body

    if (!Array.isArray(contentIds)) {
      return NextResponse.json(
        { error: 'contentIds must be an array of content IDs' },
        { status: 400 }
      )
    }

    if (contentIds.length === 0) {
      return NextResponse.json(
        { error: 'contentIds array cannot be empty' },
        { status: 400 }
      )
    }

    // Verify all content items belong to this module
    const existingContent = await prisma.course_content.findMany({
      where: {
        id: { in: contentIds },
        moduleId: moduleId,
        courseId: courseId,
        ...notDeleted,
      },
      select: { id: true },
    })

    const existingIds = new Set(existingContent.map((c) => c.id))
    const invalidIds = contentIds.filter((cid: string) => !existingIds.has(cid))

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid content IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Update orderIndex for each content item
    await Promise.all(
      contentIds.map(async (contentId: string, index: number) => {
        await prisma.course_content.update({
          where: { id: contentId },
          data: { orderIndex: index },
        })
      })
    )

    // Return updated content ordered by orderIndex
    const updatedContent = await prisma.course_content.findMany({
      where: {
        moduleId: moduleId,
        courseId: courseId,
        ...notDeleted,
      },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        fileUrl: true,
        thumbnailUrl: true,
        orderIndex: true,
        isPublished: true,
        createdAt: true,
        moduleId: true,
      },
    })

    return NextResponse.json({
      content: updatedContent.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error reordering module content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
