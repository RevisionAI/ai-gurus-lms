/**
 * Optimistic Grade Update Hook
 *
 * Provides optimistic UI updates for grade changes with automatic rollback on failure.
 * Shows toast notifications for success/error states.
 *
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * AC: 2.2.5, 2.2.7
 */

import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * API response types
 */
interface GradeUpdateResponse {
  success: true;
  grade: {
    id: string;
    points: number;
    studentId: string;
    assignmentId: string;
    gradedAt: string;
  };
  previousPoints: number | null;
}

interface GradeUpdateError {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}

/**
 * Error types for grade updates
 */
export interface OptimisticGradeError {
  code: string;
  message: string;
  isRetryable: boolean;
}

/**
 * Hook return type
 */
export interface UseOptimisticGradeUpdateReturn {
  /** Update grade with optimistic UI */
  updateGrade: (newGrade: number) => Promise<boolean>;
  /** Current loading state */
  isLoading: boolean;
  /** Error if update failed */
  error: OptimisticGradeError | null;
  /** Reset error state */
  clearError: () => void;
}

/**
 * Hook options
 */
export interface UseOptimisticGradeUpdateOptions {
  /** Course ID for the API endpoint */
  courseId: string;
  /** Submission ID to update */
  submissionId: string;
  /** Original grade value for rollback */
  originalGrade: number | null;
  /** Callback when grade updates successfully */
  onSuccess?: (newGrade: number, previousGrade: number | null) => void;
  /** Callback when grade update fails (for rollback) */
  onError?: (error: OptimisticGradeError, originalGrade: number | null) => void;
  /** Callback for optimistic update (immediate UI update before API call) */
  onOptimisticUpdate?: (newGrade: number) => void;
}

/**
 * Check if an error code is retryable
 */
function isRetryableError(code: string): boolean {
  const retryableCodes = ['NETWORK_ERROR', 'INTERNAL_ERROR', 'RATE_LIMIT_EXCEEDED'];
  return retryableCodes.includes(code);
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(code: string, serverMessage: string): string {
  switch (code) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests. Please wait a moment and try again.';
    case 'UNAUTHORIZED':
      return 'Your session has expired. Please log in again.';
    case 'FORBIDDEN':
      return "You don't have permission to update this grade.";
    case 'NOT_FOUND':
      return 'The submission was not found. It may have been deleted.';
    case 'INVALID_INPUT':
      return serverMessage || 'Invalid grade value.';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection.';
    default:
      return serverMessage || 'Failed to update grade. Please try again.';
  }
}

/**
 * Hook for optimistic grade updates with rollback
 */
export function useOptimisticGradeUpdate(
  options: UseOptimisticGradeUpdateOptions
): UseOptimisticGradeUpdateReturn {
  const {
    courseId,
    submissionId,
    originalGrade,
    onSuccess,
    onError,
    onOptimisticUpdate,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<OptimisticGradeError | null>(null);

  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update grade with optimistic UI
   */
  const updateGrade = useCallback(
    async (newGrade: number): Promise<boolean> => {
      // Clear any previous errors
      setError(null);
      setIsLoading(true);

      // Optimistic update: update UI immediately
      onOptimisticUpdate?.(newGrade);

      try {
        const response = await fetch(
          `/api/instructor/gradebook/${courseId}/grade`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              submissionId,
              grade: newGrade,
            }),
          }
        );

        // Check if component is still mounted
        if (!isMountedRef.current) return false;

        if (!response.ok) {
          // Parse error response
          const errorData: GradeUpdateError = await response.json();
          const errorCode = errorData.error?.code || 'UNKNOWN_ERROR';
          const errorMessage = getErrorMessage(
            errorCode,
            errorData.error?.message || 'Unknown error'
          );

          const gradeError: OptimisticGradeError = {
            code: errorCode,
            message: errorMessage,
            isRetryable: isRetryableError(errorCode),
          };

          // Rollback optimistic update
          setError(gradeError);
          onError?.(gradeError, originalGrade);

          // Show error toast
          toast.error(errorMessage, {
            duration: 4000,
            position: 'bottom-right',
          });

          setIsLoading(false);
          return false;
        }

        // Parse success response
        const data: GradeUpdateResponse = await response.json();

        // Show success toast
        toast.success(
          originalGrade === null
            ? `Grade set to ${newGrade}`
            : `Grade updated to ${newGrade}`,
          {
            duration: 2000,
            position: 'bottom-right',
          }
        );

        // Call success callback
        onSuccess?.(newGrade, data.previousPoints);

        setIsLoading(false);
        return true;
      } catch (err) {
        // Network error or other failure
        if (!isMountedRef.current) return false;

        const gradeError: OptimisticGradeError = {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
          isRetryable: true,
        };

        // Rollback optimistic update
        setError(gradeError);
        onError?.(gradeError, originalGrade);

        // Show error toast
        toast.error(gradeError.message, {
          duration: 4000,
          position: 'bottom-right',
        });

        console.error('[useOptimisticGradeUpdate] Error:', err);

        setIsLoading(false);
        return false;
      }
    },
    [courseId, submissionId, originalGrade, onSuccess, onError, onOptimisticUpdate]
  );

  return {
    updateGrade,
    isLoading,
    error,
    clearError,
  };
}
