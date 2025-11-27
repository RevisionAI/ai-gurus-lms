import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { softDelete, notDeleted } from '@/lib/soft-delete'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, contentId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id: id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const content = await prisma.courseContent.findUnique({
      where: {
        id: contentId,
        courseId: id
      }
    })

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, contentId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id: id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { title, type, content, fileUrl, thumbnailUrl, isPublished, orderIndex } = await request.json()

    const existingContent = await prisma.courseContent.findUnique({
      where: {
        id: contentId,
        courseId: id
      }
    })

    if (!existingContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const updatedContent = await prisma.courseContent.update({
      where: {
        id: contentId
      },
      data: {
        title: title || existingContent.title,
        type: type || existingContent.type,
        content: content !== undefined ? content : existingContent.content,
        fileUrl: fileUrl !== undefined ? fileUrl : existingContent.fileUrl,
        thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existingContent.thumbnailUrl,
        isPublished: isPublished !== undefined ? isPublished : existingContent.isPublished,
        orderIndex: orderIndex !== undefined ? orderIndex : existingContent.orderIndex
      }
    })

    return NextResponse.json(updatedContent)
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, contentId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id: id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const content = await prisma.courseContent.findUnique({
      where: {
        id: contentId,
        courseId: id,
        ...notDeleted,
      }
    })

    if (!content) {
      return NextResponse.json({ error: 'Content not found or has been archived' }, { status: 404 })
    }

    // Soft delete content
    await softDelete(prisma.courseContent, contentId)

    return NextResponse.json({ message: 'Content archived successfully' })
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}