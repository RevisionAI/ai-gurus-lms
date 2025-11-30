import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const submission = await prisma.submissions.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: session.user.id
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { content, fileUrl } = await request.json()

    if ((!content || !content.trim()) && !fileUrl) {
      return NextResponse.json({ error: 'Either content or file is required' }, { status: 400 })
    }

    // Check if assignment exists, is published, and not deleted
    const assignment = await prisma.assignments.findFirst({
      where: {
        id: id,
        isPublished: true,
        ...notDeleted,
        courses: {
          isActive: true,
          ...notDeleted
        }
      },
      include: {
        courses: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or no longer available' }, { status: 404 })
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: assignment.courseId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Check if assignment is overdue
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      return NextResponse.json({ error: 'Assignment is overdue' }, { status: 400 })
    }

    // Check if submission already exists
    const existingSubmission = await prisma.submissions.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: session.user.id
        }
      }
    })

    if (existingSubmission) {
      return NextResponse.json({ error: 'Submission already exists' }, { status: 400 })
    }

    const submission = await prisma.submissions.create({
      data: {
        id: randomUUID(),
        content: content || null,
        fileUrl: fileUrl || null,
        assignmentId: id,
        studentId: session.user.id
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { content, fileUrl } = await request.json()

    if ((!content || !content.trim()) && !fileUrl) {
      return NextResponse.json({ error: 'Either content or file is required' }, { status: 400 })
    }

    // Check if submission exists
    const existingSubmission = await prisma.submissions.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: session.user.id
        }
      },
      include: {
        assignments: {
          include: {
            courses: true
          }
        }
      }
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if assignment is overdue
    if (existingSubmission.assignments.dueDate && new Date() > existingSubmission.assignments.dueDate) {
      return NextResponse.json({ error: 'Assignment is overdue' }, { status: 400 })
    }

    const submission = await prisma.submissions.update({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: session.user.id
        }
      },
      data: {
        content: content || null,
        fileUrl: fileUrl || null,
        submittedAt: new Date()
      }
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}