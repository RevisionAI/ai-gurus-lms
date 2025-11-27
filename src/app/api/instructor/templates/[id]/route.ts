/**
 * Feedback Template Detail API Route
 * GET /api/instructor/templates/[id] - Get single template
 * PUT /api/instructor/templates/[id] - Update template
 * DELETE /api/instructor/templates/[id] - Delete template
 *
 * Story: 2.7 - Feedback Templates for Instructors
 * @see docs/stories/2-7-feedback-templates-for-instructors.md
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateRequest, cuidSchema } from '@/lib/validation'
import { updateFeedbackTemplateSchema } from '@/validators/feedbackTemplate'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/instructor/templates/[id]
 * Get a single feedback template by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Instructor access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Validate ID format
    const idValidation = cuidSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid template ID format' } },
        { status: 400 }
      )
    }

    const template = await prisma.feedbackTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      )
    }

    // Verify ownership (skip for admin)
    if (session.user.role !== 'ADMIN' && template.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized to access this template' } },
        { status: 403 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('[Templates API] GET [id] error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/instructor/templates/[id]
 * Update an existing feedback template
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Instructor access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Validate ID format
    const idValidation = cuidSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid template ID format' } },
        { status: 400 }
      )
    }

    // Check template exists and verify ownership
    const existingTemplate = await prisma.feedbackTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      )
    }

    // Verify ownership (skip for admin)
    if (session.user.role !== 'ADMIN' && existingTemplate.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized to modify this template' } },
        { status: 403 }
      )
    }

    // Validate request body
    const validation = await validateRequest(request, updateFeedbackTemplateSchema)
    if (!validation.success) {
      return validation.response
    }

    const { name, category, template, isShared } = validation.data

    // Build update data (only include defined fields)
    const updateData: { name?: string; category?: string; template?: string; isShared?: boolean } = {}
    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (template !== undefined) updateData.template = template
    if (isShared !== undefined) updateData.isShared = isShared

    const updatedTemplate = await prisma.feedbackTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ template: updatedTemplate })
  } catch (error) {
    console.error('[Templates API] PUT error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/instructor/templates/[id]
 * Delete a feedback template
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Instructor access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Validate ID format
    const idValidation = cuidSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid template ID format' } },
        { status: 400 }
      )
    }

    // Check template exists and verify ownership
    const existingTemplate = await prisma.feedbackTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      )
    }

    // Verify ownership (skip for admin)
    if (session.user.role !== 'ADMIN' && existingTemplate.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized to delete this template' } },
        { status: 403 }
      )
    }

    await prisma.feedbackTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Templates API] DELETE error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
