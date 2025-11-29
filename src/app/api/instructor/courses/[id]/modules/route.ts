/**
 * Module API Endpoints - List and Create
 * Story 1.5: Create Module API Endpoints
 *
 * GET  /api/instructor/courses/[id]/modules - List all modules for a course
 * POST /api/instructor/courses/[id]/modules - Create a new module
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/soft-delete';
import { createModuleSchema } from '@/lib/validations/module';

/**
 * GET /api/instructor/courses/[id]/modules
 * List all modules for a course with content/assignment/discussion counts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify course exists and belongs to this instructor (or user is admin)
    const course = await prisma.courses.findFirst({
      where: {
        id: id,
        ...(session.user.role === 'ADMIN' ? {} : { instructorId: session.user.id }),
        ...notDeleted,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch modules with counts
    const modules = await prisma.modules.findMany({
      where: {
        courseId: id,
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
    });

    // Transform response to include counts at top level
    const response = modules.map((module) => ({
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
    }));

    return NextResponse.json({ modules: response });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/instructor/courses/[id]/modules
 * Create a new module for a course
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify course exists and belongs to this instructor (or user is admin)
    const course = await prisma.courses.findFirst({
      where: {
        id: id,
        ...(session.user.role === 'ADMIN' ? {} : { instructorId: session.user.id }),
        ...notDeleted,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createModuleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, requiresPrevious } = validationResult.data;

    // Get the next order index (max + 1)
    const lastModule = await prisma.modules.findFirst({
      where: {
        courseId: id,
        ...notDeleted,
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });

    const orderIndex = (lastModule?.orderIndex ?? -1) + 1;

    // Create the module
    const newModule = await prisma.modules.create({
      data: {
        id: randomUUID(),
        title,
        description,
        orderIndex,
        isPublished: false,
        requiresPrevious: requiresPrevious ?? true,
        courseId: id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
