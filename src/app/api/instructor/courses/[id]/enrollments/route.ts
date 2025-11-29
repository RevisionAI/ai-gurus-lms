import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Verify instructor owns the course
    const course = await prisma.courses.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const enrollments = await prisma.enrollments.findMany({
      where: {
        courseId: id
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    // Transform 'users' to 'user' for frontend compatibility
    const transformedEnrollments = enrollments.map(enrollment => ({
      id: enrollment.id,
      user: enrollment.users
    }))

    return NextResponse.json(transformedEnrollments)
  } catch (error) {
    console.error('Error fetching course enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify instructor owns the course
    const course = await prisma.courses.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if user exists and is a student
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
        role: 'STUDENT'
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: id
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Student already enrolled' }, { status: 400 })
    }

    const enrollment = await prisma.enrollments.create({
      data: {
        id: randomUUID(),
        userId,
        courseId: id
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Transform 'users' to 'user' for frontend compatibility
    const transformedEnrollment = {
      id: enrollment.id,
      user: enrollment.users
    }

    return NextResponse.json(transformedEnrollment, { status: 201 })
  } catch (error) {
    console.error('Error enrolling student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}