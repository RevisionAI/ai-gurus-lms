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

    // Verify instructor owns the assignment
    const assignment = await prisma.assignment.findUnique({
      where: {
        id,
        createdById: session.user.id
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const submissions = await prisma.submission.findMany({
      where: {
        assignmentId: id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignment: {
          select: {
            id: true,
            title: true,
            maxPoints: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Get grades for these submissions
    const submissionsWithGrades = await Promise.all(
      submissions.map(async (submission) => {
        const grade = await prisma.grade.findUnique({
          where: {
            assignmentId_studentId: {
              assignmentId: id,
              studentId: submission.studentId
            }
          }
        })
        return {
          ...submission,
          grade
        }
      })
    )

    return NextResponse.json(submissionsWithGrades)
  } catch (error) {
    console.error('Error fetching assignment submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}