'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BookOpen, Download, RefreshCw, AlertCircle, Grid, List } from 'lucide-react';
import {
  GradebookGrid,
  GradebookList,
  EditableGradebookGrid,
  GradeUpdateConfirmDialog,
  GradebookMatrix,
  GradebookStudent,
  GradebookFilters,
  GradebookFilterState,
  defaultFilters,
} from '@/components/gradebook';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { calculateGPA, GradeInput } from '@/lib/gpa';

/**
 * Pending grade change state for confirmation dialog
 */
interface PendingGradeChange {
  studentId: string;
  assignmentId: string;
  submissionId: string;
  oldGrade: number | null;
  newGrade: number;
  maxPoints: number;
}

/**
 * Build query string from filter state
 */
function buildFilterQueryString(filters: GradebookFilterState): string {
  const params = new URLSearchParams();

  if (filters.studentFilter) {
    params.set('studentFilter', filters.studentFilter);
  }
  if (filters.assignmentId) {
    params.set('assignmentId', filters.assignmentId);
  }
  if (filters.dateFrom) {
    params.set('dateFrom', filters.dateFrom);
  }
  if (filters.dateTo) {
    params.set('dateTo', filters.dateTo);
  }
  if (filters.status !== 'all') {
    params.set('status', filters.status);
  }

  return params.toString();
}

/**
 * Parse filter state from URL search params
 */
function parseFiltersFromSearchParams(
  searchParams: URLSearchParams
): GradebookFilterState {
  return {
    studentFilter: searchParams.get('studentFilter') || '',
    assignmentId: searchParams.get('assignmentId') || null,
    dateFrom: searchParams.get('dateFrom') || null,
    dateTo: searchParams.get('dateTo') || null,
    status: (searchParams.get('status') as GradebookFilterState['status']) || 'all',
  };
}

/**
 * Gradebook Page
 *
 * Displays complete gradebook matrix for a specific course with:
 * - Grid view on desktop (students x assignments)
 * - List view on mobile (expandable student cards)
 * - Color-coded status indicators
 * - GPA calculation for each student
 * - Filtering by student, assignment, date, status (Story 2.3)
 * - CSV export functionality (Story 2.3)
 * - Inline grade editing with confirmation (Story 2.2)
 * - URL-based filter persistence (Story 2.3)
 *
 * Story: 2.1 - Gradebook Grid View Implementation
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * Story: 2.3 - Gradebook Filtering & CSV Export
 */
export default function GradebookPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [gradebook, setGradebook] = useState<GradebookMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'auto' | 'grid' | 'list'>('auto');
  const [exporting, setExporting] = useState(false);

  // Filter state - initialized from URL
  const [filters, setFilters] = useState<GradebookFilterState>(() =>
    parseFiltersFromSearchParams(searchParams)
  );

  // Inline editing state
  const [pendingChange, setPendingChange] = useState<PendingGradeChange | null>(null);
  const [savingCellId, setSavingCellId] = useState<string | null>(null);

  // Detect mobile viewport for auto view switching
  const isMobile = useIsMobile();

  // Determine which view to show
  const showGrid = viewMode === 'grid' || (viewMode === 'auto' && !isMobile);
  const showList = viewMode === 'list' || (viewMode === 'auto' && isMobile);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.studentFilter !== '' ||
      filters.assignmentId !== null ||
      filters.dateFrom !== null ||
      filters.dateTo !== null ||
      filters.status !== 'all'
    );
  }, [filters]);

  // Sync URL with filter state
  useEffect(() => {
    const queryString = buildFilterQueryString(filters);
    const newUrl = queryString ? `?${queryString}` : '';
    const currentPath = window.location.pathname;

    // Only update if different from current URL
    if (window.location.search !== (newUrl || '?').replace('?', '') && window.location.search !== newUrl) {
      router.replace(`${currentPath}${newUrl}`, { scroll: false });
    }
  }, [filters, router]);

  // Fetch gradebook data with filters
  const fetchGradebook = useCallback(async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      const queryString = buildFilterQueryString(filters);
      const url = `/api/instructor/gradebook/${courseId}${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch gradebook');
      }

      const data = await response.json();
      setGradebook(data.data);
    } catch (err) {
      console.error('Error fetching gradebook:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [courseId, filters]);

  // Fetch on mount and when courseId or filters change
  useEffect(() => {
    fetchGradebook();
  }, [fetchGradebook]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((newFilters: GradebookFilterState) => {
    setFilters(newFilters);
  }, []);

  /**
   * Update local gradebook state with new grade (optimistic update)
   */
  const updateLocalGrade = useCallback(
    (studentId: string, assignmentId: string, newGrade: number) => {
      if (!gradebook) return;

      setGradebook((prev) => {
        if (!prev) return prev;

        const updatedStudents = prev.students.map((student) => {
          if (student.id !== studentId) return student;

          // Update grades array
          const updatedGrades = student.grades.map((grade) => {
            if (grade.assignmentId !== assignmentId) return grade;
            return {
              ...grade,
              score: newGrade,
              status: 'graded' as const,
            };
          });

          // Recalculate totals
          const totalPossiblePoints = prev.assignments.reduce(
            (sum, a) => sum + a.maxPoints,
            0
          );

          let totalPoints = 0;
          const gradedAssignments: GradeInput[] = [];

          updatedGrades.forEach((g) => {
            if (g.score !== null) {
              const maxPts =
                prev.assignments.find((a) => a.id === g.assignmentId)
                  ?.maxPoints || 100;
              totalPoints += g.score;
              gradedAssignments.push({
                points: g.score,
                maxPoints: maxPts,
                weight: 1,
                isGraded: true,
              });
            }
          });

          const percentage =
            totalPossiblePoints > 0
              ? Math.round((totalPoints / totalPossiblePoints) * 10000) / 100
              : 0;

          const gpaResult = calculateGPA(gradedAssignments);
          const gpa = gpaResult?.gpa ?? null;

          return {
            ...student,
            grades: updatedGrades,
            totalPoints,
            percentage,
            gpa,
          };
        });

        return {
          ...prev,
          students: updatedStudents,
        };
      });
    },
    [gradebook]
  );

  /**
   * Handle grade change request from editable cell (opens confirmation dialog)
   */
  const handleGradeChangeRequest = useCallback(
    (
      studentId: string,
      assignmentId: string,
      submissionId: string | null,
      oldGrade: number | null,
      newGrade: number,
      maxPoints: number
    ) => {
      if (!submissionId) {
        console.warn('Cannot grade: no submission exists');
        return;
      }

      setPendingChange({
        studentId,
        assignmentId,
        submissionId,
        oldGrade,
        newGrade,
        maxPoints,
      });
    },
    []
  );

  /**
   * Handle confirmation dialog confirm
   */
  const handleConfirmGradeChange = useCallback(async () => {
    if (!pendingChange) return;

    const { studentId, assignmentId, submissionId, oldGrade, newGrade } =
      pendingChange;
    const cellId = `${studentId}-${assignmentId}`;

    // Close dialog
    setPendingChange(null);

    // Start loading state
    setSavingCellId(cellId);

    // Optimistic update
    updateLocalGrade(studentId, assignmentId, newGrade);

    try {
      const response = await fetch(
        `/api/instructor/gradebook/${courseId}/grade`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId, grade: newGrade }),
        }
      );

      if (!response.ok) {
        // Rollback on error
        if (oldGrade !== null) {
          updateLocalGrade(studentId, assignmentId, oldGrade);
        } else {
          // Refetch to get correct state
          await fetchGradebook();
        }

        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update grade');
      }

      toast.success('Grade updated successfully');
    } catch (err) {
      console.error('Failed to update grade:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update grade');
    } finally {
      setSavingCellId(null);
    }
  }, [pendingChange, courseId, updateLocalGrade, fetchGradebook]);

  /**
   * Handle confirmation dialog cancel
   */
  const handleCancelGradeChange = useCallback(() => {
    setPendingChange(null);
  }, []);

  /**
   * Handle edit cancel (from cell)
   */
  const handleEditCancel = useCallback(() => {
    // Nothing to do - cell handles its own state
  }, []);

  // Handle cell click for non-editable grid (legacy)
  const handleCellClick = (studentId: string, assignmentId: string) => {
    console.log('Cell clicked:', { studentId, assignmentId });
  };

  /**
   * Export gradebook to CSV via server-side API
   * Respects current filters and triggers browser download
   */
  const handleExportCSV = useCallback(async () => {
    if (!gradebook || exporting) return;

    // Check if there's data to export
    if (gradebook.students.length === 0) {
      toast.error('No data to export');
      return;
    }

    setExporting(true);

    try {
      // Build export URL with current filters
      const queryString = buildFilterQueryString(filters);
      const exportUrl = `/api/instructor/gradebook/${courseId}/export${queryString ? `?${queryString}` : ''}`;

      // Trigger download via browser
      window.open(exportUrl, '_blank');

      toast.success('Grades exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export grades. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [gradebook, exporting, filters, courseId]);

  /**
   * Keyboard shortcut handler (Ctrl+E / Cmd+E for export)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+E or Cmd+E for export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExportCSV();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExportCSV]);

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar />

        {/* Toast container for notifications */}
        <Toaster />

        {/* Grade Update Confirmation Dialog */}
        <GradeUpdateConfirmDialog
          isOpen={pendingChange !== null}
          oldGrade={pendingChange?.oldGrade ?? null}
          newGrade={pendingChange?.newGrade ?? 0}
          maxPoints={pendingChange?.maxPoints}
          onConfirm={handleConfirmGradeChange}
          onCancel={handleCancelGradeChange}
        />
        <main className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                Gradebook
              </h1>
              {gradebook && (
                <p className="text-sm text-text-secondary mt-1">
                  {gradebook.courseCode} - {gradebook.courseTitle}
                  {hasActiveFilters && (
                    <span className="ml-2 text-pink-600">
                      (Filters applied)
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* View Toggle (desktop only) */}
              <div className="hidden md:flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    showGrid
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Grid view"
                  aria-pressed={showGrid}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    showList
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="List view"
                  aria-pressed={showList}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchGradebook}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                title="Refresh gradebook"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                disabled={!gradebook || loading || exporting || gradebook.students.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                title="Export to CSV (Ctrl+E)"
              >
                <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* Filters Component */}
          {gradebook && (
            <GradebookFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              assignments={gradebook.assignments}
              isLoading={loading}
            />
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-green-100 border border-green-200" />
              <span className="text-gray-600">Graded</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
              <span className="text-gray-600">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
              <span className="text-gray-600">Late</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-red-100 border border-red-200" />
              <span className="text-gray-600">Missing</span>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  <button
                    onClick={fetchGradebook}
                    className="mt-2 text-sm text-red-600 underline hover:text-red-500"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !gradebook && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && gradebook?.students.length === 0 && (
            <div className="bg-card-bg rounded-lg shadow p-6">
              <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-text-primary">
                  {hasActiveFilters ? 'No matching results' : 'No students enrolled'}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or clear all filters to see all students.'
                    : 'There are no students enrolled in this course yet.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => setFilters(defaultFilters)}
                    className="mt-4 text-sm text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Gradebook Content */}
          {gradebook && gradebook.students.length > 0 && (
            <>
              {/* Results count */}
              {hasActiveFilters && (
                <div className="mb-4 text-sm text-gray-600">
                  Showing {gradebook.students.length} student{gradebook.students.length !== 1 ? 's' : ''} and{' '}
                  {gradebook.assignments.length} assignment{gradebook.assignments.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* Editable Grid View (desktop default) */}
              {showGrid && (
                <div className="hidden md:block">
                  <EditableGradebookGrid
                    students={gradebook.students}
                    assignments={gradebook.assignments}
                    savingCellId={savingCellId}
                    onGradeChangeRequest={handleGradeChangeRequest}
                    onCancel={handleEditCancel}
                    isLoading={loading}
                  />
                </div>
              )}

              {/* List View (mobile default - not editable for now) */}
              {showList && (
                <div className={showGrid ? 'md:hidden' : ''}>
                  <GradebookList
                    students={gradebook.students}
                    assignments={gradebook.assignments}
                    onCellClick={handleCellClick}
                  />
                </div>
              )}

              {/* Stats Summary */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Students"
                  value={gradebook.students.length.toString()}
                />
                <StatCard
                  label="Assignments"
                  value={gradebook.assignments.length.toString()}
                />
                <StatCard
                  label="Avg. Percentage"
                  value={`${calculateAveragePercentage(gradebook.students).toFixed(1)}%`}
                />
                <StatCard
                  label="Avg. GPA"
                  value={calculateAverageGPA(gradebook.students)}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

/**
 * Calculate average percentage across all students
 */
function calculateAveragePercentage(students: GradebookStudent[]): number {
  if (students.length === 0) return 0;
  const total = students.reduce((sum, s) => sum + s.percentage, 0);
  return total / students.length;
}

/**
 * Calculate average GPA across students with grades
 */
function calculateAverageGPA(students: GradebookStudent[]): string {
  const studentsWithGPA = students.filter((s) => s.gpa !== null);
  if (studentsWithGPA.length === 0) return 'N/A';
  const total = studentsWithGPA.reduce((sum, s) => sum + (s.gpa || 0), 0);
  return (total / studentsWithGPA.length).toFixed(2);
}
