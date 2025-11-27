/**
 * Feedback Templates API Route
 * GET /api/instructor/templates - List all templates for instructor
 * POST /api/instructor/templates - Create new template
 *
 * Story: 2.7 - Feedback Templates for Instructors
 * @see docs/stories/2-7-feedback-templates-for-instructors.md
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateRequest } from '@/lib/validation'
import { feedbackTemplateSchema, templateQuerySchema } from '@/validators/feedbackTemplate'
import { z } from 'zod'

/**
 * GET /api/instructor/templates
 * Retrieve all feedback templates for the authenticated instructor
 */
export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      category: searchParams.get('category') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      order: searchParams.get('order') || undefined,
    }

    const queryResult = templateQuerySchema.safeParse(queryParams)
    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid query parameters',
            details: queryResult.error.errors,
          },
        },
        { status: 400 }
      )
    }

    const { category, sortBy, order } = queryResult.data

    // Build where clause
    const where: { instructorId: string; category?: string } = {
      instructorId: session.user.id,
    }

    if (category) {
      where.category = category
    }

    // Build orderBy clause
    type OrderByValue = 'asc' | 'desc'
    const orderBy: Record<string, OrderByValue> = {}
    orderBy[sortBy || 'createdAt'] = order || 'desc'

    const templates = await prisma.feedbackTemplate.findMany({
      where,
      orderBy,
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[Templates API] GET error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/instructor/templates
 * Create a new feedback template
 */
export async function POST(request: Request) {
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

    // Validate request body
    const validation = await validateRequest(request, feedbackTemplateSchema)
    if (!validation.success) {
      return validation.response
    }

    const { name, category, template, isShared } = validation.data

    // Create template
    const newTemplate = await prisma.feedbackTemplate.create({
      data: {
        name,
        category,
        template,
        isShared: isShared ?? false,
        instructorId: session.user.id,
      },
    })

    return NextResponse.json({ template: newTemplate }, { status: 201 })
  } catch (error) {
    console.error('[Templates API] POST error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
