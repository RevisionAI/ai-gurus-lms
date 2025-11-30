import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, submissionId } = await params

    // Verify instructor owns the assignment
    const assignment = await prisma.assignments.findUnique({
      where: {
        id: id,
        createdById: session.user.id
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const submission = await prisma.submissions.findUnique({
      where: {
        id: submissionId,
        assignmentId: id
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const grade = await prisma.grades.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: submission.studentId
        }
      }
    })

    if (!grade) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
    }

    return NextResponse.json(grade)
  } catch (error) {
    console.error('Error fetching grade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, submissionId } = await params
    const { points, feedback } = await request.json()

    if (points === undefined || points === null) {
      return NextResponse.json({ error: 'Points are required' }, { status: 400 })
    }

    // Verify instructor owns the assignment
    const assignment = await prisma.assignments.findUnique({
      where: {
        id: id,
        createdById: session.user.id
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const submission = await prisma.submissions.findUnique({
      where: {
        id: submissionId,
        assignmentId: id
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const pointsValue = parseFloat(points)
    if (isNaN(pointsValue) || pointsValue < 0 || pointsValue > assignment.maxPoints) {
      return NextResponse.json(
        { error: `Points must be between 0 and ${assignment.maxPoints}` },
        { status: 400 }
      )
    }

    // Check if grade already exists
    const existingGrade = await prisma.grades.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: submission.studentId
        }
      }
    })

    if (existingGrade) {
      return NextResponse.json({ error: 'Grade already exists' }, { status: 400 })
    }

    const grade = await prisma.grades.create({
      data: {
        id: randomUUID(),
        points: pointsValue,
        feedback: feedback || null,
        assignmentId: id,
        studentId: submission.studentId,
        gradedById: session.user.id
      }
    })

    return NextResponse.json(grade, { status: 201 })
  } catch (error) {
    console.error('Error creating grade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, submissionId } = await params
    const { points, feedback } = await request.json()

    if (points === undefined || points === null) {
      return NextResponse.json({ error: 'Points are required' }, { status: 400 })
    }

    // Verify instructor owns the assignment
    const assignment = await prisma.assignments.findUnique({
      where: {
        id: id,
        createdById: session.user.id
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const submission = await prisma.submissions.findUnique({
      where: {
        id: submissionId,
        assignmentId: id
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const pointsValue = parseFloat(points)
    if (isNaN(pointsValue) || pointsValue < 0 || pointsValue > assignment.maxPoints) {
      return NextResponse.json(
        { error: `Points must be between 0 and ${assignment.maxPoints}` },
        { status: 400 }
      )
    }

    const grade = await prisma.grades.update({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: submission.studentId
        }
      },
      data: {
        points: pointsValue,
        feedback: feedback || null,
        gradedAt: new Date()
      }
    })

    return NextResponse.json(grade)
  } catch (error) {
    console.error('Error updating grade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}