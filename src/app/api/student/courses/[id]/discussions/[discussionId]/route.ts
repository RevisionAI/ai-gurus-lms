import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    const discussion = await prisma.discussions.findUnique({
      where: {
        id: discussionId,
        courseId: id
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        discussion_posts: {
          where: {
            parentId: null // Only get top-level posts
          },
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            other_discussion_posts: {
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

    // Transform for frontend compatibility
    const transformedDiscussion = {
      id: discussion.id,
      title: discussion.title,
      description: discussion.description,
      isPinned: discussion.isPinned,
      isLocked: discussion.isLocked,
      createdAt: discussion.createdAt,
      author: discussion.users,
      posts: discussion.discussion_posts.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        author: post.users,
        replies: post.other_discussion_posts.map(reply => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          author: reply.users
        }))
      }))
    }

    return NextResponse.json(transformedDiscussion)
  } catch (error) {
    console.error('Error fetching discussion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}