import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string; postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, discussionId, postId } = await params

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
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
    const discussion = await prisma.discussion.findUnique({
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

    // Check if post exists and user is the author
    const post = await prisma.discussionPost.findUnique({
      where: {
        id: postId,
        discussionId: discussionId
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 })
    }

    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const updatedPost = await prisma.discussionPost.update({
      where: {
        id: postId
      },
      data: {
        content: content.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating discussion post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string; postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, discussionId, postId } = await params

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
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
    const discussion = await prisma.discussion.findUnique({
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

    // Check if post exists and user is the author
    const post = await prisma.discussionPost.findUnique({
      where: {
        id: postId,
        discussionId: discussionId
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 })
    }

    await prisma.discussionPost.delete({
      where: {
        id: postId
      }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting discussion post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}