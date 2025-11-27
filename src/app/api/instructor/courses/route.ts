import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCourseSchema } from '@/validators/course'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await prisma.course.findMany({
      where: {
        instructorId: session.user.id
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching instructor courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate with Zod schema
    const validation = createCourseSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
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

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      )
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        code,
        semester,
        year,
        isActive,
        prerequisites,
        learningObjectives,
        targetAudience,
        instructorId: session.user.id
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}