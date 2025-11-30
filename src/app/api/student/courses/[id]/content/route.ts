import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if student is enrolled in an active, non-deleted course
    const enrollment = await prisma.enrollments.findFirst({
      where: {
        userId: session.user.id,
        courseId: id,
        courses: {
          isActive: true,
          ...notDeleted
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course or course not available' }, { status: 403 })
    }

    // Get published, non-deleted content only
    const content = await prisma.course_content.findMany({
      where: {
        courseId: id,
        isPublished: true,
        ...notDeleted
      },
      orderBy: {
        orderIndex: 'asc'
      },
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        fileUrl: true,
        thumbnailUrl: true,
        orderIndex: true,
        createdAt: true
      }
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching course content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}