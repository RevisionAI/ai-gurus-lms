import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, discussionId } = await params

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: id
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Check if discussion exists and is not locked
    const discussion = await prisma.discussions.findUnique({
      where: {
        id: discussionId,
        courseId: id
      }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    if (discussion.isLocked) {
      return NextResponse.json({ error: 'Discussion is locked' }, { status: 403 })
    }

    const { content, parentId } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // If parentId is provided, verify the parent post exists
    if (parentId) {
      const parentPost = await prisma.discussion_posts.findUnique({
        where: {
          id: parentId,
          discussionId: discussionId
        }
      })

      if (!parentPost) {
        return NextResponse.json({ error: 'Parent post not found' }, { status: 404 })
      }
    }

    const post = await prisma.discussion_posts.create({
      data: {
        id: randomUUID(),
        content: content.trim(),
        discussionId,
        authorId: session.user.id,
        parentId: parentId || null,
        updatedAt: new Date()
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

    // Transform 'users' to 'author' for frontend compatibility
    const transformedPost = {
      id: post.id,
      content: post.content,
      discussionId: post.discussionId,
      parentId: post.parentId,
      createdAt: post.createdAt,
      author: post.users
    }

    return NextResponse.json(transformedPost, { status: 201 })
  } catch (error) {
    console.error('Error creating discussion post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}