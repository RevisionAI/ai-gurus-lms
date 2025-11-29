/**
 * Student Module Content Detail API
 * Story 3.3: Module Content View - Security Fix
 *
 * GET /api/student/courses/[id]/modules/[moduleId]/content/[contentId]
 * Returns specific content item with module-scoped authorization
 *
 * Security: This endpoint verifies:
 * 1. User authentication
 * 2. Course enrollment
 * 3. Module is unlocked for this user
 * 4. Content belongs to the specified module
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/soft-delete';
import { isModuleUnlocked } from '@/lib/modules';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string; contentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Verify user authentication and role
    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, moduleId, contentId } = await params;

    // 2. Verify student is enrolled in the course
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

    // 3. Verify module is unlocked for this user
    const unlockInfo = await isModuleUnlocked(moduleId, session.user.id, courseId);

    if (!unlockInfo.isUnlocked) {
      return NextResponse.json(
        {
          error: 'MODULE_LOCKED',
          message: unlockInfo.unlockMessage || 'Complete the previous module to unlock',
          prerequisiteModuleId: unlockInfo.prerequisiteModuleId,
        },
        { status: 403 }
      );
    }

    // 4. Fetch content and verify it belongs to the specified module
    const content = await prisma.course_content.findFirst({
      where: {
        id: contentId,
        moduleId: moduleId,
        courseId: courseId,
        isPublished: true,
        ...notDeleted,
      },
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        fileUrl: true,
        thumbnailUrl: true,
      },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found in this module' },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching module content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
