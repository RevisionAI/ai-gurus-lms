import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enrollments = await prisma.enrollments.findMany({
      where: {
        userId: session.user.id,
        courses: {
          isActive: true
        }
      },
      include: {
        courses: {
          include: {
            users: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Transform 'users' to 'instructor' for frontend compatibility
    const courses = enrollments.map(enrollment => ({
      id: enrollment.courses.id,
      title: enrollment.courses.title,
      code: enrollment.courses.code,
      instructor: enrollment.courses.users
    }))

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching student courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}