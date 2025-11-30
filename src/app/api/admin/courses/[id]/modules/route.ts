/**
 * Admin Module Management API - List and Create Modules
 *
 * GET  /api/admin/courses/[id]/modules - List all modules for a course
 * POST /api/admin/courses/[id]/modules - Create a new module
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { invalidateAdminStats } from '@/lib/redis'
import { createModuleSchema } from '@/lib/validations/module'

// ============================================
// GET - List All Modules for a Course
// ============================================

export async function GET(
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

    const { id: courseId } = await params

    // Verify course exists
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        ...notDeleted,
      },
      select: {
        id: true,
        title: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    // Fetch modules with counts
    const modules = await prisma.modules.findMany({
      where: {
        courseId,
        ...notDeleted,
      },
      orderBy: {
        orderIndex: 'asc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        orderIndex: true,
        isPublished: true,
        requiresPrevious: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            course_content: { where: notDeleted },
            assignments: { where: notDeleted },
            discussions: { where: notDeleted },
          },
        },
      },
    })

    // Transform response to include counts at top level
    const transformedModules = modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.orderIndex,
      isPublished: module.isPublished,
      requiresPrevious: module.requiresPrevious,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      contentCount: module._count.course_content,
      assignmentCount: module._count.assignments,
      discussionCount: module._count.discussions,
    }))

    return NextResponse.json({
      data: transformedModules,
      course: {
        id: course.id,
        title: course.title,
      },
    })
  } catch (error) {
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch modules' } },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Create Module
// ============================================

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

    // Apply rate limiting
    const rateLimitResponse = await applyUserRateLimit(
      session.user.id,
      '/api/admin/courses/modules'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id: courseId } = await params

    // Verify course exists
    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        ...notDeleted,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = createModuleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      )
    }

    const { title, description, requiresPrevious } = validation.data

    // Get the next order index (max + 1)
    const lastModule = await prisma.modules.findFirst({
      where: {
        courseId,
        ...notDeleted,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    })

    const orderIndex = (lastModule?.orderIndex ?? -1) + 1

    // Create the module
    const newModule = await prisma.modules.create({
      data: {
        id: randomUUID(),
        title,
        description,
        orderIndex,
        isPublished: false,
        requiresPrevious: requiresPrevious ?? true,
        courseId,
        updatedAt: new Date(),
      },
    })

    // Log module creation
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_module_created',
        moduleId: newModule.id,
        courseId,
        createdBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({ data: newModule }, { status: 201 })
  } catch (error) {
    console.error('Error creating module:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create module' } },
      { status: 500 }
    )
  }
}
