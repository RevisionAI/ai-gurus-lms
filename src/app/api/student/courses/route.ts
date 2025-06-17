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
        userId: session.user.id,
        course: {
          isActive: true
        }
      },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    const courses = enrollments.map(enrollment => enrollment.course)

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching student courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}