import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalUsers,
      totalCourses,
      totalStudents,
      totalInstructors,
      totalEnrollments,
      totalAssignments
    ] = await Promise.all([
      prisma.users.count(),
      prisma.courses.count(),
      prisma.users.count({ where: { role: 'STUDENT' } }),
      prisma.users.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.enrollments.count(),
      prisma.assignments.count()
    ])

    const stats = {
      totalUsers,
      totalCourses,
      totalStudents,
      totalInstructors,
      totalEnrollments,
      totalAssignments
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}