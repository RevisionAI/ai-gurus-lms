import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const course = await prisma.courses.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const discussions = await prisma.discussions.findMany({
      where: {
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

    return NextResponse.json(discussions)
  } catch (error) {
    console.error('Error fetching discussions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const course = await prisma.courses.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { title, description, isPinned } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const discussion = await prisma.discussions.create({
      data: {
        id: randomUUID(),
        title,
        description,
        isPinned: isPinned || false,
        courseId: id,
        createdBy: session.user.id
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
      }
    })

    return NextResponse.json(discussion, { status: 201 })
  } catch (error) {
    console.error('Error creating discussion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}