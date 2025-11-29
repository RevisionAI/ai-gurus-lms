/**
 * Student Module API Endpoints
 * Story 3.1: Student Module Overview
 * Story 3.2: Module Lock/Unlock States
 *
 * GET /api/student/courses/[id]/modules - List published modules for enrolled student
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/soft-delete';
import { getModulesUnlockInfo, type ModuleStatus } from '@/lib/modules';

/**
 * GET /api/student/courses/[id]/modules
 * List published modules for an enrolled student with content counts, progress, and unlock status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify student is enrolled in the course
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Verify course exists and is not deleted
    const course = await prisma.courses.findFirst({
      where: {
        id: id,
        ...notDeleted,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch only published modules with counts
    const modules = await prisma.modules.findMany({
      where: {
        courseId: id,
        isPublished: true,
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
        _count: {
          select: {
            course_content: { where: notDeleted },
            assignments: { where: notDeleted },
            discussions: { where: notDeleted },
          },
        },
      },
    });

    // Get unlock info for all modules (includes progress and status)
    const unlockInfoMap = await getModulesUnlockInfo(id, session.user.id);

    // Transform response with unlock status
    const response = modules.map((module) => {
      const unlockInfo = unlockInfoMap.get(module.id);

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        orderIndex: module.orderIndex,
        contentCount: module._count.course_content,
        assignmentCount: module._count.assignments,
        discussionCount: module._count.discussions,
        progress: unlockInfo?.progress ?? 0,
        status: unlockInfo?.status ?? ('available' as ModuleStatus),
        isUnlocked: unlockInfo?.isUnlocked ?? true,
        unlockMessage: unlockInfo?.unlockMessage,
        prerequisiteModuleId: unlockInfo?.prerequisiteModuleId,
        prerequisiteModuleTitle: unlockInfo?.prerequisiteModuleTitle,
      };
    });

    // Calculate overall course progress (only from unlocked modules)
    const unlockedModules = response.filter((m) => m.isUnlocked);
    const courseProgress =
      unlockedModules.length > 0
        ? Math.round(
            unlockedModules.reduce((sum, m) => sum + m.progress, 0) /
              unlockedModules.length
          )
        : 0;

    return NextResponse.json({
      modules: response,
      courseProgress: courseProgress,
    });
  } catch (error) {
    console.error('Error fetching student modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
