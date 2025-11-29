import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'

export async function GET(
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

    // Fetch content items for this module
    const content = await prisma.course_content.findMany({
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
      content: content.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching module content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
