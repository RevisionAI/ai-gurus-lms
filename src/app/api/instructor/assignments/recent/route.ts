import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assignments = await prisma.assignments.findMany({
      where: {
        createdById: session.user.id
      },
      include: {
        courses: {
          select: {
            title: true,
            code: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Transform Prisma relation names to frontend expected names
    const transformed = assignments.map(({ courses, ...rest }) => ({
      ...rest,
      course: courses // rename 'courses' → 'course' for frontend
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching recent assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}