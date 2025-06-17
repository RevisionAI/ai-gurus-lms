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

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        courseId: true
      }
    })

    const courseIds = enrollments.map(e => e.courseId)

    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: {
          in: courseIds
        },
        isPublished: true,
        dueDate: {
          gte: new Date()
        }
      },
      include: {
        course: {
          select: {
            title: true,
            code: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching upcoming assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}