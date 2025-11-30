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

    // Check if student is enrolled in an active, non-deleted course
    const enrollment = await prisma.enrollments.findFirst({
      where: {
        userId: session.user.id,
        courseId: id,
        courses: {
          isActive: true,
          ...notDeleted
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course or course not available' }, { status: 403 })
    }

    // Only get non-deleted discussions
    const discussions = await prisma.discussions.findMany({
      where: {
        courseId: id,
        ...notDeleted
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            discussion_posts: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform for frontend compatibility:
    // - 'users' → 'author'
    // - '_count.discussion_posts' → '_count.posts'
    const transformedDiscussions = discussions.map(discussion => ({
      id: discussion.id,
      title: discussion.title,
      description: discussion.description,
      isPinned: discussion.isPinned,
      isLocked: discussion.isLocked,
      createdAt: discussion.createdAt,
      author: discussion.users,
      _count: {
        posts: discussion._count.discussion_posts
      }
    }))

    return NextResponse.json(transformedDiscussions)
  } catch (error) {
    console.error('Error fetching discussions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}