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

    // Only get published, non-deleted assignments
    const assignments = await prisma.assignments.findMany({
      where: {
        courseId: id,
        isPublished: true,
        ...notDeleted
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching course assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}