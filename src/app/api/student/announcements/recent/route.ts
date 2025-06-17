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

    const announcements = await prisma.announcement.findMany({
      where: {
        courseId: {
          in: courseIds
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true
          }
        },
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching recent announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}