'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Course GPA data structure
 */
export interface CourseGPAData {
  courseId: string;
  courseName: string;
  courseCode: string;
  gpa: number | null;
  percentage: number | null;
  letterGrade: string;
  gradedCount: number;
}

/**
 * Overall GPA data structure
 */
export interface OverallGPAData {
  overallGPA: number | null;
  percentage: number | null;
  letterGrade: string;
  isCalculated: boolean;
  courseGPAs: CourseGPAData[];
  courseCount: number;
  coursesWithGrades: number;
}

/**
 * Single course GPA data structure
 */
export interface SingleCourseGPAData {
  courseId: string;
  courseTitle: string;
  courseCode: string;
  gpa: number | null;
  percentage: number | null;
  letterGrade: string;
  isCalculated: boolean;
  gradedCount: number;
}

/**
 * Hook state structure
 */
interface UseGPAState {
  data: OverallGPAData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching and caching overall GPA data
 *
 * @returns Object containing GPA data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useGPA();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} onRetry={refetch} />;
 *
 * return <GPASummary {...data} />;
 * ```
 */
export function useGPA() {
  const [state, setState] = useState<UseGPAState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchGPA = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/students/gpa/overall');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: OverallGPAData = await response.json();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch GPA',
      });
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchGPA();
  }, [fetchGPA]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchGPA,
  };
}

/**
 * Custom hook for fetching GPA for a specific course
 *
 * @param courseId - The course ID to fetch GPA for
 * @returns Object containing course GPA data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useCourseGPA(courseId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 *
 * return <GPACard gpa={data.gpa} letterGrade={data.letterGrade} />;
 * ```
 */
export function useCourseGPA(courseId: string) {
  const [state, setState] = useState<{
    data: SingleCourseGPAData | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchCourseGPA = useCallback(async () => {
    if (!courseId) {
      setState({ data: null, isLoading: false, error: 'No course ID provided' });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/students/gpa/course/${courseId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: SingleCourseGPAData = await response.json();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch course GPA',
      });
    }
  }, [courseId]);

  // Fetch when courseId changes
  useEffect(() => {
    fetchCourseGPA();
  }, [fetchCourseGPA]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchCourseGPA,
  };
}

export default useGPA;
