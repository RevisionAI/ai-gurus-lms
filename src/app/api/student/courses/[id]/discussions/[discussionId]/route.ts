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