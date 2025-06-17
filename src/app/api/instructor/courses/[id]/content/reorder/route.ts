import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const course = await prisma.course.findUnique({
      where: {
        id: id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { contentOrder } = await request.json()

    if (!Array.isArray(contentOrder)) {
      return NextResponse.json(
        { error: 'Content order must be an array of content IDs' },
        { status: 400 }
      )
    }

    // Update the order of each content item
    await Promise.all(
      contentOrder.map(async (contentId, index) => {
        await prisma.courseContent.update({
          where: {
            id: contentId,
            courseId: id
          },
          data: {
            orderIndex: index + 1
          }
        })
      })
    )

    // Get the updated content
    const updatedContent = await prisma.courseContent.findMany({
      where: {
        courseId: id
      },
      orderBy: {
        orderIndex: 'asc'
      }
    })

    return NextResponse.json(updatedContent)
  } catch (error) {
    console.error('Error reordering course content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
