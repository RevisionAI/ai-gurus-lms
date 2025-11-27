import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { softDelete, notDeleted } from '@/lib/soft-delete'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, announcementId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const announcement = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
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
        course: {
          select: {
            id: true,
            title: true,
            code: true
          }
        }
      }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, announcementId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { title, content } = await request.json()

    const announcement = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
        courseId: id
      }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    if (announcement.authorId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own announcements' }, { status: 403 })
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: {
        id: announcementId
      },
      data: {
        title: title || announcement.title,
        content: content || announcement.content
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

    return NextResponse.json(updatedAnnouncement)
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, announcementId } = await params

    const course = await prisma.course.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const announcement = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
        courseId: id,
        ...notDeleted,
      }
    })

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found or has been archived' }, { status: 404 })
    }

    if (announcement.authorId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own announcements' }, { status: 403 })
    }

    // Soft delete announcement
    await softDelete(prisma.announcement, announcementId)

    return NextResponse.json({ message: 'Announcement archived successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}