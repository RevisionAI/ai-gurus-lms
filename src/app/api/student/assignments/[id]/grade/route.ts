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

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const grade = await prisma.grade.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: session.user.id
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