/**
 * Admin Content Management API - Individual Content Operations
 *
 * GET    /api/admin/courses/[id]/content/[contentId] - Get content details
 * PUT    /api/admin/courses/[id]/content/[contentId] - Update content
 * DELETE /api/admin/courses/[id]/content/[contentId] - Soft delete content
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted, softDelete } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { invalidateAdminStats } from '@/lib/redis'
import { z } from 'zod'

// Admin update schema with all content fields plus moduleId
const adminUpdateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['TEXT', 'VIDEO', 'DOCUMENT', 'LINK', 'YOUTUBE']).optional(),
  content: z.string().optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
  moduleId: z.string().nullable().optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'At least one field must be provided for update' }
)

// ============================================
// GET - Get Content Details
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
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

    const { id: courseId, contentId } = await params

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

    // Fetch the content
    const content = await prisma.course_content.findFirst({
      where: {
        id: contentId,
        courseId,
        ...notDeleted,
      },
      include: {
        modules: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!content) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        ...content,
        module: content.modules,
        modules: undefined,
      },
    })
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch content' } },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update Content
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
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
      '/api/admin/courses/content'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id: courseId, contentId } = await params

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
    const validation = adminUpdateContentSchema.safeParse(body)
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

    // Check if content exists
    const existingContent = await prisma.course_content.findFirst({
      where: {
        id: contentId,
        courseId,
        ...notDeleted,
      },
    })

    if (!existingContent) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found' } },
        { status: 404 }
      )
    }

    const { title, type, content, fileUrl, thumbnailUrl, isPublished, orderIndex, moduleId } =
      validation.data as {
        title?: string
        type?: string
        content?: string | null
        fileUrl?: string | null
        thumbnailUrl?: string | null
        isPublished?: boolean
        orderIndex?: number
        moduleId?: string | null
      }

    // If moduleId provided, verify it exists and belongs to course
    if (moduleId !== undefined && moduleId !== null) {
      const targetModule = await prisma.modules.findFirst({
        where: {
          id: moduleId,
          courseId,
          ...notDeleted,
        },
      })

      if (!targetModule) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Module not found' } },
          { status: 404 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title
    if (type !== undefined) updateData.type = type
    if (content !== undefined) updateData.content = content
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex
    if (moduleId !== undefined) updateData.moduleId = moduleId

    const updatedContent = await prisma.course_content.update({
      where: { id: contentId },
      data: updateData,
    })

    // Log content update
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_content_updated',
        contentId,
        courseId,
        updatedFields: Object.keys(updateData).filter((k) => k !== 'updatedAt'),
        updatedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({ data: updatedContent })
  } catch (error) {
    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update content' } },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Soft Delete Content
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
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
      '/api/admin/courses/content'
    )
    if (rateLimitResponse) return rateLimitResponse

    const { id: courseId, contentId } = await params

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

    // Check if content exists
    const content = await prisma.course_content.findFirst({
      where: {
        id: contentId,
        courseId,
        ...notDeleted,
      },
      select: {
        id: true,
        title: true,
        type: true,
        moduleId: true,
      },
    })

    if (!content) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Content not found or already deleted' } },
        { status: 404 }
      )
    }

    // Soft delete content
    await softDelete(prisma.course_content, contentId)

    // Log content deletion
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_content_deleted',
        contentId,
        courseId,
        contentTitle: content.title,
        contentType: content.type,
        deletedBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({ message: 'Content archived successfully' })
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete content' } },
      { status: 500 }
    )
  }
}
