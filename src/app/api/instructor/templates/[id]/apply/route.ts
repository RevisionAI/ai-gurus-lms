/**
 * Feedback Template Apply API Route
 * POST /api/instructor/templates/[id]/apply - Apply template with placeholder replacement
 *
 * Story: 2.7 - Feedback Templates for Instructors
 * @see docs/stories/2-7-feedback-templates-for-instructors.md
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateRequest, cuidSchema } from '@/lib/validation'
import { applyTemplateSchema } from '@/validators/feedbackTemplate'
import { replacePlaceholders } from '@/lib/feedbackTemplate'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/instructor/templates/[id]/apply
 * Apply a template by replacing placeholders and incrementing usage count
 */
export async function POST(request: Request, { params }: RouteParams) {
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

    // Validate request body
    const validation = await validateRequest(request, applyTemplateSchema)
    if (!validation.success) {
      return validation.response
    }

    const { studentName, assignmentTitle, score, customNote } = validation.data

    // Fetch template and verify ownership in a transaction
    // Atomically increment usage count to prevent race conditions
    const template = await prisma.$transaction(async (tx) => {
      const existingTemplate = await tx.feedbackTemplate.findUnique({
        where: { id },
      })

      if (!existingTemplate) {
        return null
      }

      // Verify ownership (allow own templates or shared templates)
      const isOwner = existingTemplate.instructorId === session.user.id
      const isShared = existingTemplate.isShared
      const isAdmin = session.user.role === 'ADMIN'

      if (!isOwner && !isShared && !isAdmin) {
        return { forbidden: true }
      }

      // Increment usage count atomically
      return await tx.feedbackTemplate.update({
        where: { id },
        data: {
          usageCount: { increment: 1 },
        },
      })
    })

    if (!template) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Template not found' } },
        { status: 404 }
      )
    }

    if ('forbidden' in template) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not authorized to use this template' } },
        { status: 403 }
      )
    }

    // Replace placeholders in template
    const feedbackText = replacePlaceholders(template.template, {
      studentName,
      assignmentTitle,
      score,
      customNote,
    })

    return NextResponse.json({
      feedbackText,
      templateId: template.id,
      templateName: template.name,
      usageCount: template.usageCount,
    })
  } catch (error) {
    console.error('[Templates API] POST apply error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
