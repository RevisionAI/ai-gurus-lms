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
        userId: session.user.id
      },
      select: {
        courseId: true
      }
    })

    const courseIds = enrollments.map(e => e.courseId)

    const announcements = await prisma.announcements.findMany({
      where: {
        courseId: {
          in: courseIds
        }
      },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            code: true
          }
        },
        users: {
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

    // Transform 'courses' to 'course' and 'users' to 'author' for frontend compatibility
    const transformedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      createdAt: announcement.createdAt,
      course: announcement.courses,
      author: announcement.users
    }))

    return NextResponse.json(transformedAnnouncements)
  } catch (error) {
    console.error('Error fetching recent announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}