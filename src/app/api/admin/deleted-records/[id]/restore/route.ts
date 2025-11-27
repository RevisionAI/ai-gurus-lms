import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { restoreRecord, SoftDeleteModel, SOFT_DELETE_MODELS } from '@/lib/soft-delete'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    // Admin-only access
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const model = body.model as SoftDeleteModel

    if (!model || !SOFT_DELETE_MODELS.includes(model)) {
      return NextResponse.json(
        { error: { code: 'INVALID_MODEL', message: 'Invalid or missing model type' } },
        { status: 400 }
      )
    }

    const cascadeRestore = body.cascadeRestore !== false // Default to true for courses

    const restored = await restoreRecord(model, id, cascadeRestore)

    if (!restored) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Record not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: `${model} restored successfully`,
      data: restored,
    })
  } catch (error) {
    console.error('Error restoring record:', error)
    return NextResponse.json(
      { error: { code: 'RESTORE_FAILED', message: 'Failed to restore record' } },
      { status: 500 }
    )
  }
}
