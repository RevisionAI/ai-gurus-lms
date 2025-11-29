/**
 * useModuleProgress Hook
 * Story 3.7: Module Progress API
 *
 * React hook for fetching and managing module progress
 */

import { useState, useCallback, useEffect } from 'react';

export interface ModuleProgress {
  percentage: number;
  isComplete: boolean;
  contentViewed: number;
  contentTotal: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  completedAt: string | null;
}

export interface UnlockedModule {
  id: string;
  title: string;
}

export interface ContentCompletionResult {
  success: boolean;
  moduleProgress: number;
  isModuleComplete: boolean;
  unlockedModule?: UnlockedModule;
}

interface UseModuleProgressReturn {
  progress: ModuleProgress | null;
  isLoading: boolean;
  error: string | null;
  fetchProgress: () => Promise<void>;
  markContentComplete: (contentId: string) => Promise<ContentCompletionResult | null>;
}

/**
 * Hook for managing module progress
 *
 * @param courseId - The course ID
 * @param moduleId - The module ID
 * @returns Progress data and actions
 */
export function useModuleProgress(
  courseId: string,
  moduleId: string
): UseModuleProgressReturn {
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch current progress for the module
   */
  const fetchProgress = useCallback(async () => {
    if (!courseId || !moduleId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/student/courses/${courseId}/modules/${moduleId}/progress`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch progress');
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, moduleId]);

  /**
   * Mark content as complete and return updated progress
   */
  const markContentComplete = useCallback(
    async (contentId: string): Promise<ContentCompletionResult | null> => {
      if (!courseId || !moduleId || !contentId) return null;

      try {
        const response = await fetch(
          `/api/student/courses/${courseId}/modules/${moduleId}/content/${contentId}/complete`,
          { method: 'POST' }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to mark content complete');
        }

        const result: ContentCompletionResult = await response.json();

        // Update local progress after completion
        if (progress) {
          setProgress({
            ...progress,
            percentage: result.moduleProgress,
            isComplete: result.isModuleComplete,
            contentViewed: progress.contentViewed + 1,
          });
        }

        return result;
      } catch (err) {
        console.error('Error marking content complete:', err);
        return null;
      }
    },
    [courseId, moduleId, progress]
  );

  // Auto-fetch progress on mount and when courseId/moduleId changes
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    isLoading,
    error,
    fetchProgress,
    markContentComplete,
  };
}

export default useModuleProgress;
