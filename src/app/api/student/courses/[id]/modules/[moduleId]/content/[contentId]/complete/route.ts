/**
 * Content Completion API
 * Story 3.4: Content Completion Tracking
 *
 * POST /api/student/courses/[id]/modules/[moduleId]/content/[contentId]/complete
 * Marks content as viewed and returns updated module progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/soft-delete';
import { isModuleUnlocked } from '@/lib/modules';
import { markContentViewed } from '@/lib/module-progress';
import { cuidSchema } from '@/lib/validation';

// Validation schema for route params
const paramsSchema = z.object({
  id: cuidSchema,
  moduleId: cuidSchema,
  contentId: cuidSchema,
});

interface RouteParams {
  params: Promise<{
    id: string;
    moduleId: string;
    contentId: string;
  }>;
}

/**
 * POST /api/student/courses/[id]/modules/[moduleId]/content/[contentId]/complete
 * Marks content as viewed for the current student
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id: courseId, moduleId, contentId } = validation.data;

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

    // Verify content belongs to the module
    const content = await prisma.course_content.findFirst({
      where: {
        id: contentId,
        moduleId: moduleId,
        isPublished: true,
        ...notDeleted,
      },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found in this module' },
        { status: 404 }
      );
    }

    // Mark content as viewed and get updated progress
    const progressResult = await markContentViewed(
      moduleId,
      session.user.id,
      contentId
    );

    // Return only the expected fields per architecture spec
    return NextResponse.json({
      success: progressResult.success,
      moduleProgress: progressResult.moduleProgress,
      isModuleComplete: progressResult.isModuleComplete,
      unlockedModule: progressResult.unlockedModule || null,
    });
  } catch (error) {
    console.error('Error marking content complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
