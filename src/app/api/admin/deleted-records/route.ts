import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSoftDeletedRecords, SoftDeleteModel, SOFT_DELETE_MODELS } from '@/lib/soft-delete'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Admin-only access
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model') as SoftDeleteModel | null

    // If specific model requested
    if (model) {
      if (!SOFT_DELETE_MODELS.includes(model)) {
        return NextResponse.json(
          { error: { code: 'INVALID_MODEL', message: 'Invalid model type' } },
          { status: 400 }
        )
      }
      const records = await getSoftDeletedRecords(model)
      return NextResponse.json({ data: { [model]: records } })
    }

    // Return all soft-deleted records from all models
    const [users, courses, assignments, grades, discussions, courseContent, announcements] = await Promise.all([
      getSoftDeletedRecords('user'),
      getSoftDeletedRecords('course'),
      getSoftDeletedRecords('assignment'),
      getSoftDeletedRecords('grade'),
      getSoftDeletedRecords('discussion'),
      getSoftDeletedRecords('courseContent'),
      getSoftDeletedRecords('announcement'),
    ])

    return NextResponse.json({
      data: {
        users,
        courses,
        assignments,
        grades,
        discussions,
        courseContent,
        announcements,
      },
    })
  } catch (error) {
    console.error('Error fetching deleted records:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch deleted records' } },
      { status: 500 }
    )
  }
}
