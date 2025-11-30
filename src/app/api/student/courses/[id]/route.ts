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

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: id
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Only return course if it's active and not deleted
    const course = await prisma.courses.findFirst({
      where: {
        id,
        isActive: true,
        ...notDeleted
      },
      include: {
        users: {
          select: {
            name: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found or no longer available' }, { status: 404 })
    }

    // Transform 'users' to 'instructor' for frontend compatibility
    const transformedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      code: course.code,
      semester: course.semester,
      year: course.year,
      prerequisites: course.prerequisites,
      learningObjectives: course.learningObjectives,
      targetAudience: course.targetAudience,
      instructor: course.users
    }

    return NextResponse.json(transformedCourse)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}