/**
 * Admin User Management API - Update and Delete Users
 *
 * GET    /api/admin/users/[id] - Get single user details
 * PUT    /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Soft delete user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { softDelete, notDeleted } from '@/lib/soft-delete'
import { validateRequest } from '@/lib/validation'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { adminUpdateUserSchema, AdminUpdateUserInput } from '@/validators/user'
import { invalidateAdminStats } from '@/lib/redis'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ============================================
// GET - Get Single User
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
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
      '/api/admin/users/[id]'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params

    const user = await prisma.user.findFirst({
      where: { id, ...notDeleted },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        cellNumber: true,
        company: true,
        position: true,
        workAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user' } },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update User
// ============================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
      '/api/admin/users/[id]'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params

    // Validate request body
    const validation = await validateRequest<AdminUpdateUserInput>(
      request,
      adminUpdateUserSchema
    )
    if (!validation.success) {
      return validation.response
    }

    const { name, email, role, isActive } = validation.data

    // Get current user
    const currentUser = await prisma.user.findFirst({
      where: { id, ...notDeleted },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Check if email is being changed to an existing email
    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
      if (existingUser) {
        return NextResponse.json(
          {
            error: {
              code: 'DUPLICATE_EMAIL',
              message: 'A user with this email already exists',
            },
          },
          { status: 409 }
        )
      }
    }

    // Prevent removing last admin role
    if (role && currentUser.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          deletedAt: null,
          id: { not: id },
        },
      })

      if (adminCount === 0) {
        return NextResponse.json(
          {
            error: {
              code: 'LAST_ADMIN',
              message: 'Cannot remove last admin role from system',
            },
          },
          { status: 400 }
        )
      }
    }

    // Handle isActive = false as soft delete
    if (isActive === false && currentUser.deletedAt === null) {
      // Cannot deactivate own account
      if (id === session.user.id) {
        return NextResponse.json(
          {
            error: {
              code: 'SELF_DEACTIVATION',
              message: 'Cannot deactivate your own admin account',
            },
          },
          { status: 400 }
        )
      }

      await softDelete(prisma.user, id)

      // Log deactivation
      console.log(
        JSON.stringify({
          level: 'info',
          action: 'user_deactivated',
          userId: id,
          deactivatedBy: session.user.id,
          timestamp: new Date().toISOString(),
        })
      )

      // Invalidate admin stats cache
      await invalidateAdminStats()

      return NextResponse.json({
        data: { deleted: true, deletedAt: new Date().toISOString() },
      })
    }

    // Build update data
    const updateData: Record<string, string> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role

    // Track role changes for logging
    const roleChanged = role && role !== currentUser.role

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log update
    if (roleChanged) {
      console.log(
        JSON.stringify({
          level: 'info',
          action: 'user_role_changed',
          userId: id,
          previousRole: currentUser.role,
          newRole: role,
          changedBy: session.user.id,
          timestamp: new Date().toISOString(),
        })
      )
    } else {
      console.log(
        JSON.stringify({
          level: 'info',
          action: 'user_updated',
          userId: id,
          changes: Object.keys(updateData),
          updatedBy: session.user.id,
          timestamp: new Date().toISOString(),
        })
      )
    }

    // Invalidate admin stats cache if role changed
    if (roleChanged) {
      await invalidateAdminStats()
    }

    return NextResponse.json({ data: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Soft Delete User
// ============================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      '/api/admin/users/[id]'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id } = await params

    // Get current user
    const user = await prisma.user.findFirst({
      where: { id, ...notDeleted },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Cannot delete own account
    if (id === session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'SELF_DELETION',
            message: 'Cannot deactivate your own admin account',
          },
        },
        { status: 400 }
      )
    }

    // Prevent deleting last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          deletedAt: null,
          id: { not: id },
        },
      })

      if (adminCount === 0) {
        return NextResponse.json(
          {
            error: {
              code: 'LAST_ADMIN',
              message: 'Cannot delete the last admin account',
            },
          },
          { status: 400 }
        )
      }
    }

    // Soft delete user
    await softDelete(prisma.user, id)

    // Log deletion
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'user_deactivated',
        userId: id,
        deactivatedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({
      data: { deleted: true, deletedAt: new Date().toISOString() },
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user' } },
      { status: 500 }
    )
  }
}
