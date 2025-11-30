/**
 * Admin Content Management API - List and Create Content
 *
 * GET  /api/admin/courses/[id]/content - List all content for a course
 * POST /api/admin/courses/[id]/content - Create new content
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notDeleted } from '@/lib/soft-delete'
import { applyUserRateLimit } from '@/lib/rate-limit'
import { invalidateAdminStats } from '@/lib/redis'
import { createContentSchema } from '@/validators/course'

// ============================================
// GET - List All Content for a Course
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

    // Fetch content with module information
    const content = await prisma.course_content.findMany({
      where: {
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
      orderBy: [
        { moduleId: 'asc' },
        { orderIndex: 'asc' },
      ],
    })

    // Transform to include module at top level
    const transformedContent = content.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      content: item.content,
      fileUrl: item.fileUrl,
      thumbnailUrl: item.thumbnailUrl,
      orderIndex: item.orderIndex,
      isPublished: item.isPublished,
      moduleId: item.moduleId,
      module: item.modules,
      createdAt: item.createdAt,
    }))

    return NextResponse.json({
      data: transformedContent,
      course: {
        id: course.id,
        title: course.title,
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
// POST - Create Content
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
      '/api/admin/courses/content'
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

    // Extract moduleId separately (not in validation schema)
    const { moduleId, ...contentData } = body

    // Validate request body
    const validation = createContentSchema.safeParse(contentData)
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

    const { title, type, content, fileUrl, thumbnailUrl, isPublished } = validation.data

    // If moduleId provided, verify it exists and belongs to course
    if (moduleId) {
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

    // Get the next order index
    const lastContent = await prisma.course_content.findFirst({
      where: {
        courseId,
        ...(moduleId ? { moduleId } : {}),
        ...notDeleted,
      },
      orderBy: { orderIndex: 'desc' },
    })

    const orderIndex = (lastContent?.orderIndex ?? -1) + 1

    const newContent = await prisma.course_content.create({
      data: {
        id: randomUUID(),
        title,
        type,
        content,
        fileUrl,
        thumbnailUrl,
        orderIndex,
        isPublished: isPublished ?? false,
        courseId,
        moduleId: moduleId || null,
      },
    })

    // Log content creation
    console.log(
      JSON.stringify({
        level: 'info',
        action: 'admin_content_created',
        contentId: newContent.id,
        courseId,
        moduleId: moduleId || null,
        type,
        createdBy: session.user.id,
        timestamp: new Date().toISOString(),
      })
    )

    // Invalidate admin stats cache
    await invalidateAdminStats()

    return NextResponse.json({ data: newContent }, { status: 201 })
  } catch (error) {
    console.error('Error creating content:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create content' } },
      { status: 500 }
    )
  }
}
