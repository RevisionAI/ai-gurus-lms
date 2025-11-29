/**
 * Student Module Detail API
 * Story 3.3: Module Content View
 *
 * GET /api/student/courses/[id]/modules/[moduleId] - Get module detail with content for student
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/soft-delete';
import { isModuleUnlocked } from '@/lib/modules';
import { checkAndUpdateModuleCompletion } from '@/lib/module-progress';

/**
 * GET /api/student/courses/[id]/modules/[moduleId]
 * Returns module detail with content list, assignments, and discussions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, moduleId } = await params;

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
          message: unlockInfo.unlockMessage || 'Complete the previous module to unlock',
          prerequisiteModuleId: unlockInfo.prerequisiteModuleId,
        },
        { status: 403 }
      );
    }

    // Fetch module with related data
    const moduleData = await prisma.modules.findFirst({
      where: {
        id: moduleId,
        courseId: courseId,
        isPublished: true,
        ...notDeleted,
      },
      include: {
        course_content: {
          where: {
            isPublished: true,
            ...notDeleted,
          },
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            content: true,
            fileUrl: true,
            thumbnailUrl: true,
            orderIndex: true,
          },
        },
        assignments: {
          where: {
            isPublished: true,
            ...notDeleted,
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            maxPoints: true,
            submissions: {
              where: { studentId: session.user.id },
              select: {
                id: true,
                submittedAt: true,
              },
            },
            grades: {
              where: { studentId: session.user.id },
              select: {
                points: true,
              },
            },
          },
        },
        discussions: {
          where: notDeleted,
          select: {
            id: true,
            title: true,
            _count: {
              select: { discussion_posts: true },
            },
          },
        },
        courses: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!moduleData) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Get student's progress for this module
    const progress = await prisma.module_progress.findFirst({
      where: {
        moduleId: moduleId,
        userId: session.user.id,
        ...notDeleted,
      },
    });

    const viewedContentIds = progress?.contentViewed || [];

    // Story 3.5: Check and update module completion if needed
    // This handles the case where assignments complete the module
    const progressResult = await checkAndUpdateModuleCompletion(moduleId, session.user.id);

    // Map content with isViewed status
    const contentWithProgress = moduleData.course_content.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      thumbnailUrl: item.thumbnailUrl,
      orderIndex: item.orderIndex,
      isViewed: viewedContentIds.includes(item.id),
    }));

    // Map assignments with submission status
    const assignmentsWithStatus = moduleData.assignments.map((assignment) => {
      const submission = assignment.submissions[0];
      const grade = assignment.grades[0];
      return {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        isSubmitted: !!submission,
        isGraded: !!grade,
        grade: grade?.points ?? null,
      };
    });

    // Map discussions with post count
    const discussionsWithCounts = moduleData.discussions.map((disc) => ({
      id: disc.id,
      title: disc.title,
      postCount: disc._count.discussion_posts,
    }));

    // Use progress from checkAndUpdateModuleCompletion (correct 50/50 weighted formula)
    // Story 3.5: Assignment progress in modules
    const progressPercent = progressResult.moduleProgress;

    return NextResponse.json({
      module: {
        id: moduleData.id,
        title: moduleData.title,
        description: moduleData.description,
        progress: progressPercent,
        content: contentWithProgress,
        assignments: assignmentsWithStatus,
        discussions: discussionsWithCounts,
      },
      course: {
        id: moduleData.courses.id,
        title: moduleData.courses.title,
      },
    });
  } catch (error) {
    console.error('Error fetching student module detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
