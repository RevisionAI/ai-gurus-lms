/**
 * Module API Endpoints - Get, Update, Delete
 * Story 1.5: Create Module API Endpoints
 *
 * GET    /api/instructor/courses/[id]/modules/[moduleId] - Get module details
 * PUT    /api/instructor/courses/[id]/modules/[moduleId] - Update module
 * DELETE /api/instructor/courses/[id]/modules/[moduleId] - Soft delete module
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notDeleted, softDelete } from '@/lib/soft-delete';
import { updateModuleSchema } from '@/lib/validations/module';

/**
 * GET /api/instructor/courses/[id]/modules/[moduleId]
 * Get a single module's details with related counts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, moduleId } = await params;

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

    // Fetch the module
    const foundModule = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId: id,
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
    });

    if (!foundModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/instructor/courses/[id]/modules/[moduleId]
 * Update a module's details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, moduleId } = await params;

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
    const validationResult = updateModuleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Check if module exists
    const existingModule = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId: id,
        ...notDeleted,
      },
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const { title, description, isPublished, requiresPrevious, orderIndex } = validationResult.data;

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
      },
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/instructor/courses/[id]/modules/[moduleId]
 * Soft delete a module (sets deletedAt timestamp)
 * Optionally moves content to another module before deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, moduleId } = await params;

    // Parse request body for optional moveContentTo
    let moveContentTo: string | undefined;
    try {
      const body = await request.json();
      moveContentTo = body.moveContentTo;
    } catch {
      // No body or invalid JSON - that's OK, we'll delete without moving
    }

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

    // Check if module exists and is not already deleted
    const targetModule = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId: id,
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
    });

    if (!targetModule) {
      return NextResponse.json({ error: 'Module not found or already deleted' }, { status: 404 });
    }

    let movedCount = 0;

    // If moveContentTo is specified, move content to target module first
    if (moveContentTo) {
      // Verify target module exists and belongs to same course
      const targetMoveModule = await prisma.modules.findFirst({
        where: {
          id: moveContentTo,
          courseId: id,
          ...notDeleted,
        },
      });

      if (!targetMoveModule) {
        return NextResponse.json(
          { error: 'Target module not found' },
          { status: 404 }
        );
      }

      // Get the next order index in target module for content
      const lastContentInTarget = await prisma.course_content.findFirst({
        where: {
          moduleId: moveContentTo,
          ...notDeleted,
        },
        orderBy: { orderIndex: 'desc' },
      });
      let contentOrderIndex = (lastContentInTarget?.orderIndex ?? -1) + 1;

      // Move all content to target module
      const contentItems = await prisma.course_content.findMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        orderBy: { orderIndex: 'asc' },
      });

      for (const item of contentItems) {
        await prisma.course_content.update({
          where: { id: item.id },
          data: {
            moduleId: moveContentTo,
            orderIndex: contentOrderIndex++,
          },
        });
        movedCount++;
      }

      // Move all assignments to target module (assignments don't have orderIndex)
      const assignmentResult = await prisma.assignments.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: {
          moduleId: moveContentTo,
        },
      });
      movedCount += assignmentResult.count;

      // Move all discussions to target module
      const discussionResult = await prisma.discussions.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: {
          moduleId: moveContentTo,
        },
      });
      movedCount += discussionResult.count;
    } else {
      // Soft delete all content in this module
      const now = new Date();

      await prisma.course_content.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: { deletedAt: now },
      });

      await prisma.assignments.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: { deletedAt: now },
      });

      await prisma.discussions.updateMany({
        where: {
          moduleId: moduleId,
          ...notDeleted,
        },
        data: { deletedAt: now },
      });
    }

    // Soft delete the module
    await softDelete(prisma.modules, moduleId);

    return NextResponse.json({
      message: moveContentTo
        ? 'Module deleted and content moved successfully'
        : 'Module archived successfully',
      movedCount,
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
