/**
 * Admin User Management API - Reset Password
 *
 * POST /api/admin/users/[id]/reset-password - Generate new password for user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    // Admin-only access
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    // Apply rate limiting
    const rateLimitResponse = await applyUserRateLimit(
      session.user.id,
      '/api/admin/users/[id]/reset-password'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params

    // Get user
    const user = await prisma.users.findFirst({
      where: { id, ...notDeleted },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Generate secure random password
    const newPassword = crypto.randomBytes(16).toString('base64')
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password
    await prisma.users.update({
      where: { id },
      data: { password: hashedPassword },
    })

    // Log password reset (NEVER log the actual password)
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'password_reset',
        userId: id,
        resetBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Return new password (one-time display to admin)
    return NextResponse.json({
      data: { newPassword },
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password' } },
      { status: 500 }
    )
  }
}
