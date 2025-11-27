import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { softDelete, notDeleted } from '@/lib/soft-delete'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, discussionId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const discussion = await prisma.discussion.findUnique({
      where: {
        id: discussionId,
        courseId: id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        posts: {
          where: {
            parentId: null // Only get top-level posts
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    return NextResponse.json(discussion)
  } catch (error) {
    console.error('Error fetching discussion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, discussionId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { title, description, isPinned, isLocked } = await request.json()

    const discussion = await prisma.discussion.findUnique({
      where: {
        id: discussionId,
        courseId: id
      }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    const updatedDiscussion = await prisma.discussion.update({
      where: {
        id: discussionId
      },
      data: {
        title: title || discussion.title,
        description: description !== undefined ? description : discussion.description,
        isPinned: isPinned !== undefined ? isPinned : discussion.isPinned,
        isLocked: isLocked !== undefined ? isLocked : discussion.isLocked
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    })

    return NextResponse.json(updatedDiscussion)
  } catch (error) {
    console.error('Error updating discussion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discussionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, discussionId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const discussion = await prisma.discussion.findUnique({
      where: {
        id: discussionId,
        courseId: id,
        ...notDeleted,
      }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found or has been archived' }, { status: 404 })
    }

    // Soft delete discussion
    await softDelete(prisma.discussion, discussionId)

    return NextResponse.json({ message: 'Discussion archived successfully' })
  } catch (error) {
    console.error('Error deleting discussion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}