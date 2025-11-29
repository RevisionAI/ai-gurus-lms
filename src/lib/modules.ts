/**
 * Module Unlock Logic
 * Story 3.2: Module Lock/Unlock States
 *
 * Server-side unlock calculation per ADR-001 to prevent client-side bypass.
 */

import { prisma } from '@/lib/prisma';
import { notDeleted } from '@/lib/soft-delete';
import { calculateModuleProgress } from '@/lib/module-progress';

export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface ModuleUnlockInfo {
  isUnlocked: boolean;
  status: ModuleStatus;
  progress: number;
  unlockMessage?: string;
  prerequisiteModuleId?: string;
  prerequisiteModuleTitle?: string;
}

/**
 * Check if a module is completed for a user
 */
export async function isModuleCompleted(
  moduleId: string,
  userId: string
): Promise<boolean> {
  const progress = await prisma.module_progress.findFirst({
    where: {
      moduleId,
      userId,
      ...notDeleted,
    },
    select: {
      completedAt: true,
    },
  });

  return progress?.completedAt !== null && progress?.completedAt !== undefined;
}

/**
 * Check if a module is unlocked for a user
 * Per ADR-001: Always calculate server-side
 */
export async function isModuleUnlocked(
  moduleId: string,
  userId: string,
  courseId: string
): Promise<ModuleUnlockInfo> {
  // Get the module and all modules in the course for context
  const currentModule = await prisma.modules.findFirst({
    where: {
      id: moduleId,
      courseId,
      ...notDeleted,
    },
    select: {
      id: true,
      title: true,
      orderIndex: true,
      requiresPrevious: true,
    },
  });

  if (!currentModule) {
    return {
      isUnlocked: false,
      status: 'locked',
      progress: 0,
      unlockMessage: 'Module not found',
    };
  }

  // Get user progress for this module using the correct 50/50 formula (ADR-002)
  const progressResult = await calculateModuleProgress(moduleId, userId);
  const progress = progressResult.moduleProgress;

  // Get completion status from progress record
  const moduleProgressRecord = await prisma.module_progress.findFirst({
    where: {
      moduleId,
      userId,
      ...notDeleted,
    },
    select: {
      completedAt: true,
    },
  });

  // Check if module is completed
  if (moduleProgressRecord?.completedAt) {
    return {
      isUnlocked: true,
      status: 'completed',
      progress: 100,
    };
  }

  // First module (orderIndex === 0) is always unlocked
  if (currentModule.orderIndex === 0) {
    return {
      isUnlocked: true,
      status: progress > 0 ? 'in_progress' : 'available',
      progress,
    };
  }

  // If sequential unlock is disabled for this module
  if (!currentModule.requiresPrevious) {
    return {
      isUnlocked: true,
      status: progress > 0 ? 'in_progress' : 'available',
      progress,
    };
  }

  // Check previous module completion
  const previousModule = await prisma.modules.findFirst({
    where: {
      courseId,
      orderIndex: currentModule.orderIndex - 1,
      ...notDeleted,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!previousModule) {
    // No previous module found - unlock this one
    return {
      isUnlocked: true,
      status: progress > 0 ? 'in_progress' : 'available',
      progress,
    };
  }

  // Check if previous module is completed
  const previousCompleted = await isModuleCompleted(previousModule.id, userId);

  if (previousCompleted) {
    return {
      isUnlocked: true,
      status: progress > 0 ? 'in_progress' : 'available',
      progress,
    };
  }

  // Module is locked
  return {
    isUnlocked: false,
    status: 'locked',
    progress: 0,
    unlockMessage: `Complete "${previousModule.title}" to unlock`,
    prerequisiteModuleId: previousModule.id,
    prerequisiteModuleTitle: previousModule.title,
  };
}

/**
 * Get unlock info for all modules in a course for a user
 */
export async function getModulesUnlockInfo(
  courseId: string,
  userId: string
): Promise<Map<string, ModuleUnlockInfo>> {
  const modules = await prisma.modules.findMany({
    where: {
      courseId,
      isPublished: true,
      ...notDeleted,
    },
    orderBy: {
      orderIndex: 'asc',
    },
    select: {
      id: true,
      title: true,
      orderIndex: true,
      requiresPrevious: true,
    },
  });

  // Get all module progress for user in one query
  const allProgress = await prisma.module_progress.findMany({
    where: {
      userId,
      moduleId: { in: modules.map((m) => m.id) },
      ...notDeleted,
    },
  });

  const progressMap = new Map(allProgress.map((p) => [p.moduleId, p]));

  // Get content counts for all modules
  const contentCounts = await prisma.course_content.groupBy({
    by: ['moduleId'],
    where: {
      moduleId: { in: modules.map((m) => m.id) },
      ...notDeleted,
    },
    _count: true,
  });

  const assignmentCounts = await prisma.assignments.groupBy({
    by: ['moduleId'],
    where: {
      moduleId: { in: modules.map((m) => m.id) },
      isPublished: true,
      ...notDeleted,
    },
    _count: true,
  });

  // Get submissions with assignment info for 50/50 formula (ADR-002)
  const allSubmissions = await prisma.submissions.findMany({
    where: {
      studentId: userId,
      assignments: {
        moduleId: { in: modules.map((m) => m.id) },
        isPublished: true,
        ...notDeleted,
      },
    },
    select: {
      assignments: {
        select: { moduleId: true },
      },
    },
  });

  // Count submissions per module
  const submissionCountMap = new Map<string, number>();
  for (const sub of allSubmissions) {
    if (sub.assignments.moduleId) {
      const current = submissionCountMap.get(sub.assignments.moduleId) || 0;
      submissionCountMap.set(sub.assignments.moduleId, current + 1);
    }
  }

  const contentCountMap = new Map(contentCounts.map((c) => [c.moduleId, c._count]));
  const assignmentCountMap = new Map(assignmentCounts.map((a) => [a.moduleId, a._count]));

  const unlockInfoMap = new Map<string, ModuleUnlockInfo>();

  for (const courseModule of modules) {
    const progress = progressMap.get(courseModule.id);
    const contentCount = contentCountMap.get(courseModule.id) || 0;
    const assignmentCount = assignmentCountMap.get(courseModule.id) || 0;
    const viewedCount = progress?.contentViewed?.length || 0;
    const submittedCount = submissionCountMap.get(courseModule.id) || 0;

    // Calculate 50/50 progress (ADR-002)
    const contentPortion = contentCount > 0 ? (viewedCount / contentCount) * 50 : 50;
    const assignmentPortion = assignmentCount > 0 ? (submittedCount / assignmentCount) * 50 : 50;
    const progressPercent = Math.round(contentPortion + assignmentPortion);

    // Check if completed
    if (progress?.completedAt) {
      unlockInfoMap.set(courseModule.id, {
        isUnlocked: true,
        status: 'completed',
        progress: 100,
      });
      continue;
    }

    // First module is always unlocked
    if (courseModule.orderIndex === 0) {
      unlockInfoMap.set(courseModule.id, {
        isUnlocked: true,
        status: progressPercent > 0 ? 'in_progress' : 'available',
        progress: progressPercent,
      });
      continue;
    }

    // Check if requires previous
    if (!courseModule.requiresPrevious) {
      unlockInfoMap.set(courseModule.id, {
        isUnlocked: true,
        status: progressPercent > 0 ? 'in_progress' : 'available',
        progress: progressPercent,
      });
      continue;
    }

    // Find previous module
    const prevModuleIndex = modules.findIndex((m) => m.orderIndex === courseModule.orderIndex - 1);
    const prevModule = prevModuleIndex >= 0 ? modules[prevModuleIndex] : null;

    if (!prevModule) {
      // No previous module - unlock
      unlockInfoMap.set(courseModule.id, {
        isUnlocked: true,
        status: progressPercent > 0 ? 'in_progress' : 'available',
        progress: progressPercent,
      });
      continue;
    }

    // Check if previous is completed
    const prevUnlockInfo = unlockInfoMap.get(prevModule.id);
    const isPrevCompleted = prevUnlockInfo?.status === 'completed';

    if (isPrevCompleted) {
      unlockInfoMap.set(courseModule.id, {
        isUnlocked: true,
        status: progressPercent > 0 ? 'in_progress' : 'available',
        progress: progressPercent,
      });
    } else {
      unlockInfoMap.set(courseModule.id, {
        isUnlocked: false,
        status: 'locked',
        progress: 0,
        unlockMessage: `Complete "${prevModule.title}" to unlock`,
        prerequisiteModuleId: prevModule.id,
        prerequisiteModuleTitle: prevModule.title,
      });
    }
  }

  return unlockInfoMap;
}
