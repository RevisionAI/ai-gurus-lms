import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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

    const course = await prisma.course.findUnique({
      where: {
        id: id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const content = await prisma.courseContent.findMany({
      where: {
        courseId: id
      },
      orderBy: {
        orderIndex: 'asc'
      }
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching course content:', error)
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

    const course = await prisma.course.findUnique({
      where: {
        id: id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { title, type, content, fileUrl, thumbnailUrl, isPublished } = await request.json()

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    // Get the next order index
    const lastContent = await prisma.courseContent.findFirst({
      where: { courseId: id },
      orderBy: { orderIndex: 'desc' }
    })

    const orderIndex = (lastContent?.orderIndex || 0) + 1

    const newContent = await prisma.courseContent.create({
      data: {
        title,
        type,
        content,
        fileUrl,
        thumbnailUrl,
        orderIndex,
        isPublished: isPublished || false,
        courseId: id
      }
    })

    return NextResponse.json(newContent)
  } catch (error) {
    console.error('Error creating course content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}