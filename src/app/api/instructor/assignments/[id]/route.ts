import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { softDelete, notDeleted } from '@/lib/soft-delete'

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
    const assignment = await prisma.assignments.findUnique({
      where: {
        id,
        createdById: session.user.id
      },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            code: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const assignment = await prisma.assignments.findUnique({
      where: {
        id,
        createdById: session.user.id
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const { title, description, dueDate, maxPoints, isPublished } = await request.json()

    const updatedAssignment = await prisma.assignments.update({
      where: {
        id
      },
      data: {
        title: title || assignment.title,
        description: description !== undefined ? description : assignment.description,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : assignment.dueDate,
        maxPoints: maxPoints !== undefined ? parseInt(maxPoints) : assignment.maxPoints,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : assignment.isPublished
      }
    })

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const assignment = await prisma.assignments.findUnique({
      where: {
        id,
        createdById: session.user.id,
        ...notDeleted,
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or has been archived' }, { status: 404 })
    }

    // Soft delete assignment
    await softDelete(prisma.assignments, id)

    return NextResponse.json({ message: 'Assignment archived successfully' })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}