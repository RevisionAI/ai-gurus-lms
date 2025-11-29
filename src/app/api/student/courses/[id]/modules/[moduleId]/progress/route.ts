/**
 * Module Progress API
 * Story 3.7: Module Progress API
 *
 * GET /api/student/courses/[id]/modules/[moduleId]/progress - Get detailed progress for a module
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/soft-delete';
import { isModuleUnlocked } from '@/lib/modules';
import { calculateModuleProgress } from '@/lib/module-progress';
import { cuidSchema } from '@/lib/validation';

// Validation schema for route params
const paramsSchema = z.object({
  id: cuidSchema,
  moduleId: cuidSchema,
});

interface RouteParams {
  params: Promise<{
    id: string;
    moduleId: string;
  }>;
}

/**
 * GET /api/student/courses/[id]/modules/[moduleId]/progress
 * Returns detailed progress breakdown for a specific module
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawParams = await params;

    // Validate route parameters
    const validation = paramsSchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const { id: courseId, moduleId } = validation.data;

    // Verify student is enrolled in the course
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Verify module exists
    const moduleExists = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId: courseId,
        isPublished: true,
        ...notDeleted,
      },
    });

    if (!moduleExists) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check module unlock status
    const unlockInfo = await isModuleUnlocked(moduleId, session.user.id, courseId);

    if (!unlockInfo.isUnlocked) {
      return NextResponse.json(
        {
          error: 'MODULE_LOCKED',
          message: unlockInfo.unlockMessage || 'Module is locked',
        },
        { status: 403 }
      );
    }

    // Get detailed progress
    const progressResult = await calculateModuleProgress(moduleId, session.user.id);

    // Get completedAt from ModuleProgress
    const moduleProgress = await prisma.module_progress.findFirst({
      where: {
        moduleId,
        userId: session.user.id,
        ...notDeleted,
      },
      select: {
        completedAt: true,
      },
    });

    return NextResponse.json({
      progress: {
        percentage: progressResult.moduleProgress,
        isComplete: progressResult.isModuleComplete,
        contentViewed: progressResult.contentViewedCount,
        contentTotal: progressResult.totalContentCount,
        assignmentsSubmitted: progressResult.assignmentSubmittedCount,
        assignmentsTotal: progressResult.totalAssignmentCount,
        completedAt: moduleProgress?.completedAt || null,
      },
    });
  } catch (error) {
    console.error('Error fetching module progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
