import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cascadeSoftDeleteCourse, notDeleted } from '@/lib/soft-delete'
import { updateCourseSchema } from '@/validators/course'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const course = await prisma.courses.findUnique({
      where: {
        id,
        instructorId: session.user.id
      },
      include: {
        users: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            discussions: true,
            announcements: true,
            course_content: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate with Zod schema
    const validation = updateCourseSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      code,
      semester,
      year,
      isActive,
      prerequisites,
      learningObjectives,
      targetAudience
    } = validation.data

    const course = await prisma.courses.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if course code is being changed and if it already exists
    if (code && code !== course.code) {
      const existingCourse = await prisma.courses.findUnique({
        where: { code }
      })

      if (existingCourse) {
        return NextResponse.json(
          { error: 'Course code already exists' },
          { status: 400 }
        )
      }
    }

    // Build update data, only including fields that were provided
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (code !== undefined) updateData.code = code
    if (semester !== undefined) updateData.semester = semester
    if (year !== undefined) updateData.year = year
    if (isActive !== undefined) updateData.isActive = isActive
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites
    if (learningObjectives !== undefined) updateData.learningObjectives = learningObjectives
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience

    const updatedCourse = await prisma.courses.update({
      where: {
        id
      },
      data: updateData
    })

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const course = await prisma.courses.findUnique({
      where: {
        id,
        instructorId: session.user.id,
        ...notDeleted,
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found or has been archived' }, { status: 404 })
    }

    // Soft delete course and cascade to related content (assignments, discussions, content, announcements)
    await cascadeSoftDeleteCourse(id)

    return NextResponse.json({ message: 'Course archived successfully' })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}