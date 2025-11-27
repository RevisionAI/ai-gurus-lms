/**
 * Gradebook Component Types
 * Story: 2.1 - Gradebook Grid View Implementation
 */

/**
 * Cell status for grade display
 * - graded: grade exists with score (green)
 * - pending: submission exists but no grade (yellow)
 * - late: submission after due date, not yet graded (orange)
 * - missing: no submission and past due date (red)
 */
export type CellStatus = 'graded' | 'pending' | 'late' | 'missing';

/**
 * Individual grade cell in the matrix
 */
export interface GradebookCell {
  assignmentId: string;
  score: number | null;
  status: CellStatus;
  submissionId: string | null;
}

/**
 * Student row in the gradebook matrix
 */
export interface GradebookStudent {
  id: string;
  name: string;
  email: string;
  grades: GradebookCell[];
  totalPoints: number;
  percentage: number;
  gpa: number | null;
}

/**
 * Assignment column in the gradebook matrix
 */
export interface GradebookAssignment {
  id: string;
  title: string;
  maxPoints: number;
  dueDate: Date | string | null;
}

/**
 * Complete gradebook matrix data
 */
export interface GradebookMatrix {
  students: GradebookStudent[];
  assignments: GradebookAssignment[];
  courseId: string;
  courseTitle: string;
  courseCode: string;
}

/**
 * Props for GradebookGrid component
 */
export interface GradebookGridProps {
  students: GradebookStudent[];
  assignments: GradebookAssignment[];
  onCellClick?: (studentId: string, assignmentId: string) => void;
  isLoading?: boolean;
}

/**
 * Props for GradebookRow component
 */
export interface GradebookRowProps {
  student: GradebookStudent;
  assignments: GradebookAssignment[];
  onCellClick?: (assignmentId: string) => void;
}

/**
 * Props for GradebookCell component
 */
export interface GradebookCellProps {
  cell: GradebookCell;
  maxPoints: number;
  onClick?: () => void;
}

/**
 * Props for GradebookList component (mobile view)
 */
export interface GradebookListProps {
  students: GradebookStudent[];
  assignments: GradebookAssignment[];
  onCellClick?: (studentId: string, assignmentId: string) => void;
}

/**
 * Get CSS classes for cell status color coding
 */
export function getStatusColorClasses(status: CellStatus): string {
  switch (status) {
    case 'graded':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'late':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'missing':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status icon for cell display
 */
export function getStatusIcon(status: CellStatus): string {
  switch (status) {
    case 'graded':
      return ''; // No icon, show score
    case 'pending':
      return '⏳'; // Clock icon for pending
    case 'late':
      return '⚠️'; // Warning for late
    case 'missing':
      return '—'; // Dash for missing
    default:
      return '';
  }
}

/**
 * Get accessible status label
 */
export function getStatusLabel(status: CellStatus): string {
  switch (status) {
    case 'graded':
      return 'Graded';
    case 'pending':
      return 'Pending grade';
    case 'late':
      return 'Submitted late, pending grade';
    case 'missing':
      return 'Not submitted';
    default:
      return 'Unknown status';
  }
}
