import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'
import { createCourseSchema } from '@/validators/course'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await prisma.courses.findMany({
      where: {
        instructorId: session.user.id,
        ...notDeleted
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

    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate with Zod schema
    const validation = createCourseSchema.safeParse(body)
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

    // Check if course code already exists
    const existingCourse = await prisma.courses.findUnique({
      where: { code }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      )
    }

    const course = await prisma.courses.create({
      data: {
        id: randomUUID(),
        title,
        description,
        code,
        semester,
        year,
        isActive,
        prerequisites,
        learningObjectives,
        targetAudience,
        instructorId: session.user.id,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}