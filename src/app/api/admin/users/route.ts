/**
 * Admin User Management API - List and Create Users
 *
 * GET  /api/admin/users - List users with pagination, search, and filtering
 * POST /api/admin/users - Create a new user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'
import { validateRequest, validateData } from '@/lib/validation'
import { applyUserRateLimit } from '@/lib/rate-limit'
import {
  adminCreateUserSchema,
  userSearchSchema,
  AdminCreateUserInput,
} from '@/validators/user'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { invalidateAdminStats } from '@/lib/redis'

// ============================================
// GET - List Users
// ============================================

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

    // Apply rate limiting
    const rateLimitResponse = await applyUserRateLimit(
      session.user.id,
      '/api/admin/users'
    )
    if (rateLimitResponse) return rateLimitResponse

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    }

    const validation = validateData(queryParams, userSearchSchema)
    if (!validation.success) {
      return validation.response
    }

    const { search, role, page, limit } = validation.data

    // Build where clause
    const where: Prisma.UserWhereInput = {
      ...notDeleted,
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { surname: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    // Fetch users and total count in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      data: users,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create User
// ============================================

export async function POST(request: NextRequest) {
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
      '/api/admin/users'
    )
    if (rateLimitResponse) return rateLimitResponse

    // Validate request body
    const validation = await validateRequest<AdminCreateUserInput>(
      request,
      adminCreateUserSchema
    )
    if (!validation.success) {
      return validation.response
    }

    const { name, email, role, password: providedPassword } = validation.data

    // Check if email already exists (including soft-deleted users)
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

    // Generate password if not provided
    const plainPassword = providedPassword || crypto.randomBytes(16).toString('base64')
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    // Create user with default values for required fields
    const user = await prisma.user.create({
      data: {
        email,
        name,
        surname: '', // Default empty - admin can update later
        password: hashedPassword,
        role,
        cellNumber: '',
        company: '',
        position: '',
        workAddress: '',
      },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        createdAt: true,
      },
    })

    // Log user creation
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'user_created',
        userId: user.id,
        role: user.role,
        createdBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
      { status: 500 }
    )
  }
}
