/**
 * Admin Module Management API - Individual Module Operations
 *
 * GET    /api/admin/courses/[id]/modules/[moduleId] - Get module details
 * PUT    /api/admin/courses/[id]/modules/[moduleId] - Update module
 * DELETE /api/admin/courses/[id]/modules/[moduleId] - Soft delete module
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted, softDelete } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { invalidateAdminStats } from '@/lib/redis'
import { updateModuleSchema } from '@/lib/validations/module'

// ============================================
// GET - Get Module Details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
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

    const { id: courseId, moduleId } = await params

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

    // Fetch the module with full details
    const foundModule = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId,
        ...notDeleted,
      },
      include: {
        _count: {
          select: {
            course_content: { where: notDeleted },
            assignments: { where: notDeleted },
            discussions: { where: notDeleted },
          },
        },
        course_content: {
          where: notDeleted,
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            isPublished: true,
            orderIndex: true,
          },
        },
        assignments: {
          where: notDeleted,
          select: {
            id: true,
            title: true,
            dueDate: true,
            isPublished: true,
          },
        },
      },
    })

    if (!foundModule) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Module not found' } },
        { status: 404 }
      )
    }

    // Transform response
    const response = {
      id: foundModule.id,
      title: foundModule.title,
      description: foundModule.description,
      orderIndex: foundModule.orderIndex,
      isPublished: foundModule.isPublished,
      requiresPrevious: foundModule.requiresPrevious,
      createdAt: foundModule.createdAt,
      updatedAt: foundModule.updatedAt,
      contentCount: foundModule._count.course_content,
      assignmentCount: foundModule._count.assignments,
      discussionCount: foundModule._count.discussions,
      content: foundModule.course_content,
      assignments: foundModule.assignments,
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Error fetching module:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch module' } },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update Module
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
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

    const { id: courseId, moduleId } = await params

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
    const validation = updateModuleSchema.safeParse(body)
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

    // Check if module exists
    const existingModule = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId,
        ...notDeleted,
      },
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Module not found' } },
        { status: 404 }
      )
    }

    const { title, description, isPublished, requiresPrevious, orderIndex } = validation.data

    // Update the module with provided fields
    const updatedModule = await prisma.modules.update({
      where: {
        id: moduleId,
      },
      data: {
        title: title ?? existingModule.title,
        description: description !== undefined ? description : existingModule.description,
        isPublished: isPublished ?? existingModule.isPublished,
        requiresPrevious: requiresPrevious ?? existingModule.requiresPrevious,
        orderIndex: orderIndex ?? existingModule.orderIndex,
        updatedAt: new Date(),
      },
    })

    // Log module update
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_module_updated',
        moduleId,
        courseId,
        updatedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({ data: updatedModule })
  } catch (error) {
    console.error('Error updating module:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update module' } },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Soft Delete Module
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
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

    const { id: courseId, moduleId } = await params

    // Parse request body for optional moveContentTo
    let moveContentTo: string | undefined
    try {
      const body = await request.json()
      moveContentTo = body.moveContentTo
    } catch {
      // No body or invalid JSON - that's OK, we'll delete without moving
    }

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

    // Check if module exists
    const targetModule = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId,
        ...notDeleted,
      },
      include: {
        _count: {
          select: {
            course_content: { where: notDeleted },
            assignments: { where: notDeleted },
            discussions: { where: notDeleted },
          },
        },
      },
    })

    if (!targetModule) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Module not found or already deleted' } },
        { status: 404 }
      )
    }

    let movedCount = 0

    // If moveContentTo is specified, move content to target module first
    if (moveContentTo) {
      // Verify target module exists and belongs to same course
      const targetMoveModule = await prisma.modules.findFirst({
        where: {
          id: moveContentTo,
          courseId,
          ...notDeleted,
        },
      })

      if (!targetMoveModule) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Target module not found' } },
          { status: 404 }
        )
      }

      // Get the next order index in target module for content
      const lastContentInTarget = await prisma.course_content.findFirst({
        where: {
          moduleId: moveContentTo,
          ...notDeleted,
        },
        orderBy: { orderIndex: 'desc' },
      })
      let contentOrderIndex = (lastContentInTarget?.orderIndex ?? -1) + 1

      // Move all content to target module
      const contentItems = await prisma.course_content.findMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        orderBy: { orderIndex: 'asc' },
      })

      for (const item of contentItems) {
        await prisma.course_content.update({
          where: { id: item.id },
          data: {
            moduleId: moveContentTo,
            orderIndex: contentOrderIndex++,
          },
        })
        movedCount++
      }

      // Move all assignments to target module
      const assignmentResult = await prisma.assignments.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: {
          moduleId: moveContentTo,
        },
      })
      movedCount += assignmentResult.count

      // Move all discussions to target module
      const discussionResult = await prisma.discussions.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: {
          moduleId: moveContentTo,
        },
      })
      movedCount += discussionResult.count
    } else {
      // Soft delete all content in this module
      const now = new Date()

      await prisma.course_content.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: { deletedAt: now },
      })

      await prisma.assignments.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: { deletedAt: now },
      })

      await prisma.discussions.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: { deletedAt: now },
      })
    }

    // Soft delete the module
    await softDelete(prisma.modules, moduleId)

    // Log module deletion
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_module_deleted',
        moduleId,
        courseId,
        movedContent: !!moveContentTo,
        movedCount,
        deletedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({
      message: moveContentTo
        ? 'Module deleted and content moved successfully'
        : 'Module archived successfully',
      movedCount,
    })
  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete module' } },
      { status: 500 }
    )
  }
}
