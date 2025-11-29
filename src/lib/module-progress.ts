/**
 * Module Progress Functions
 * Story 3.4: Content Completion Tracking
 *
 * Handles tracking student progress through module content and calculating completion.
 */

import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/soft-delete';
import { randomUUID } from 'crypto';

export interface UnlockedModuleInfo {
  id: string;
  title: string;
}

export interface ModuleProgressResult {
  success: boolean;
  moduleProgress: number;
  isModuleComplete: boolean;
  contentViewedCount: number;
  totalContentCount: number;
  assignmentSubmittedCount: number;
  totalAssignmentCount: number;
  unlockedModule?: UnlockedModuleInfo;
}

/**
 * Calculate module progress using adaptive weighted formula
 *
 * If both content and assignments exist: 50/50 split
 * If only content: 100% based on content viewed
 * If only assignments: 100% based on assignments submitted
 * If neither: 0% (empty module)
 */
export async function calculateModuleProgress(
  moduleId: string,
  userId: string
): Promise<ModuleProgressResult> {
  // Get module progress record
  const progress = await prisma.module_progress.findFirst({
    where: {
      moduleId,
      userId,
      ...notDeleted,
    },
  });

  const contentViewed = progress?.contentViewed || [];

  // Get total content count for module
  const totalContentCount = await prisma.course_content.count({
    where: {
      moduleId,
      isPublished: true,
      ...notDeleted,
    },
  });

  // Get total assignment count for module
  const totalAssignmentCount = await prisma.assignments.count({
    where: {
      moduleId,
      isPublished: true,
      ...notDeleted,
    },
  });

  // Get submitted assignment count for user in this module
  const assignmentSubmittedCount = await prisma.submissions.count({
    where: {
      assignments: {
        moduleId,
        isPublished: true,
        ...notDeleted,
      },
      studentId: userId,
    },
  });

  // Calculate progress using adaptive weighting
  // If both exist: 50/50 split. If only one: 100% weight to that type.
  let moduleProgress = 0;

  const hasContent = totalContentCount > 0;
  const hasAssignments = totalAssignmentCount > 0;

  if (hasContent && hasAssignments) {
    // Both exist: 50/50 split
    const contentProgress = (contentViewed.length / totalContentCount) * 50;
    const assignmentProgress = (assignmentSubmittedCount / totalAssignmentCount) * 50;
    moduleProgress = Math.round(contentProgress + assignmentProgress);
  } else if (hasContent) {
    // Only content: 100% weight to content
    moduleProgress = Math.round((contentViewed.length / totalContentCount) * 100);
  } else if (hasAssignments) {
    // Only assignments: 100% weight to assignments
    moduleProgress = Math.round((assignmentSubmittedCount / totalAssignmentCount) * 100);
  }
  // else: no content or assignments = 0% (empty module)

  const isModuleComplete = moduleProgress >= 100;

  return {
    success: true,
    moduleProgress,
    isModuleComplete,
    contentViewedCount: contentViewed.length,
    totalContentCount,
    assignmentSubmittedCount,
    totalAssignmentCount,
  };
}

/**
 * Mark content as viewed for a user
 * Idempotent - safe to call multiple times, only adds if not already present
 */
export async function markContentViewed(
  moduleId: string,
  userId: string,
  contentId: string
): Promise<ModuleProgressResult> {
  // Get existing progress to check if content is already viewed
  const existingProgress = await prisma.module_progress.findFirst({
    where: {
      moduleId,
      userId,
      ...notDeleted,
    },
  });

  const currentContentViewed = existingProgress?.contentViewed || [];

  // Check if content is already marked as viewed (idempotent)
  if (currentContentViewed.includes(contentId)) {
    return calculateModuleProgress(moduleId, userId);
  }

  // Add contentId to the array
  const newContentViewed = [...currentContentViewed, contentId];

  // Upsert the progress record
  await prisma.module_progress.upsert({
    where: {
      moduleId_userId: {
        moduleId,
        userId,
      },
    },
    // @ts-expect-error - Prisma typing issue with unchecked create input for module_progress
    create: {
      id: randomUUID() as string,
      moduleId,
      userId,
      contentViewed: [contentId],
    },
    update: {
      contentViewed: newContentViewed,
    },
  });

  // Calculate and return updated progress
  const progressResult = await calculateModuleProgress(moduleId, userId);

  // If module is complete, update completedAt and check for unlock
  if (progressResult.isModuleComplete) {
    // Check if this is the first time completing
    const currentProgress = await prisma.module_progress.findFirst({
      where: {
        moduleId,
        userId,
        ...notDeleted,
      },
    });

    if (!currentProgress?.completedAt) {
      await prisma.module_progress.update({
        where: {
          moduleId_userId: {
            moduleId,
            userId,
          },
        },
        data: {
          completedAt: new Date(),
        },
      });

      // Story 3.6: Check for next module to unlock
      try {
        const unlockedModule = await getNextModuleToUnlock(moduleId);
        if (unlockedModule) {
          progressResult.unlockedModule = unlockedModule;
        }
      } catch (unlockError) {
        // Log error but don't fail the main operation
        console.error('Error checking module unlock:', unlockError);
      }
    }
  }

  return progressResult;
}

/**
 * Check if content has been viewed by a user
 */
export async function isContentViewed(
  moduleId: string,
  userId: string,
  contentId: string
): Promise<boolean> {
  const progress = await prisma.module_progress.findFirst({
    where: {
      moduleId,
      userId,
      ...notDeleted,
    },
    select: {
      contentViewed: true,
    },
  });

  return progress?.contentViewed?.includes(contentId) || false;
}

/**
 * Get the next module that would unlock when the current module is completed
 * Story 3.6: Automatic Module Unlock
 */
export async function getNextModuleToUnlock(
  moduleId: string
): Promise<UnlockedModuleInfo | null> {
  // Get current module's course and orderIndex
  const currentModule = await prisma.modules.findFirst({
    where: {
      id: moduleId,
      ...notDeleted,
    },
    select: {
      courseId: true,
      orderIndex: true,
    },
  });

  if (!currentModule) return null;

  // Find the next module
  const nextModule = await prisma.modules.findFirst({
    where: {
      courseId: currentModule.courseId,
      orderIndex: currentModule.orderIndex + 1,
      isPublished: true,
      requiresPrevious: true, // Only if it requires previous module
      ...notDeleted,
    },
    select: {
      id: true,
      title: true,
    },
  });

  return nextModule;
}

/**
 * Check and update module completion status
 * Story 3.5: Ensures completedAt is set when progress reaches 100%
 * Story 3.6: Returns unlocked module info when completing a module
 */
export async function checkAndUpdateModuleCompletion(
  moduleId: string,
  userId: string
): Promise<ModuleProgressResult> {
  const progressResult = await calculateModuleProgress(moduleId, userId);

  if (progressResult.isModuleComplete) {
    // Get existing progress to check if already completed
    const existing = await prisma.module_progress.findFirst({
      where: {
        moduleId,
        userId,
        ...notDeleted,
      },
    });

    // Only update and check unlock if not already completed
    if (!existing?.completedAt) {
      await prisma.module_progress.upsert({
        where: {
          moduleId_userId: {
            moduleId,
            userId,
          },
        },
        // @ts-expect-error - Prisma typing issue with unchecked create input for module_progress
        create: {
          id: randomUUID() as string,
          moduleId,
          userId,
          contentViewed: [],
          completedAt: new Date(),
        },
        update: {
          completedAt: new Date(),
        },
      });

      // Check for next module to unlock
      try {
        const unlockedModule = await getNextModuleToUnlock(moduleId);
        if (unlockedModule) {
          progressResult.unlockedModule = unlockedModule;
        }
      } catch (unlockError) {
        // Log error but don't fail the main operation
        console.error('Error checking module unlock:', unlockError);
      }
    }
  }

  return progressResult;
}
