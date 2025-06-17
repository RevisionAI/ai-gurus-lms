import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For admin users, return all courses
    if (session.user.role === 'ADMIN') {
      const courses = await prisma.course.findMany({
        include: {
          instructor: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json(courses)
    }

    // For students and instructors, redirect to their specific endpoints
    return NextResponse.json({ error: 'Use role-specific endpoints' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}