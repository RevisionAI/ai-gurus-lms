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

    // Only get published, non-deleted assignments from active, non-deleted courses
    const assignment = await prisma.assignments.findFirst({
      where: {
        id,
        isPublished: true,
        ...notDeleted,
        courses: {
          isActive: true,
          ...notDeleted
        }
      },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            code: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or no longer available' }, { status: 404 })
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: assignment.courses.id
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Transform Prisma relation name to frontend expected name
    const { courses, ...rest } = assignment
    return NextResponse.json({
      ...rest,
      course: courses // rename 'courses' → 'course' for frontend
    })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}