/**
 * CSV Export Utilities
 *
 * Provides utilities for generating CSV exports of gradebook data.
 * Handles proper escaping, Unicode support, and Excel compatibility.
 *
 * Story: 2.3 - Gradebook Filtering & CSV Export
 */

import { format } from 'date-fns';

/**
 * GradebookMatrix type for CSV generation
 * Matches the structure from the gradebook API
 */
export interface CSVGradebookStudent {
  id: string;
  name: string;
  email: string;
  grades: Array<{
    assignmentId: string;
    score: number | null;
    status: string;
  }>;
  totalPoints: number;
  percentage: number;
  gpa: number | null;
}

export interface CSVGradebookAssignment {
  id: string;
  title: string;
  maxPoints: number;
}

export interface CSVGradebookMatrix {
  students: CSVGradebookStudent[];
  assignments: CSVGradebookAssignment[];
  courseCode: string;
  courseTitle: string;
}

/**
 * UTF-8 BOM for Excel compatibility
 * Prepending this ensures Excel correctly interprets UTF-8 encoding
 */
const UTF8_BOM = '\uFEFF';

/**
 * Escape a value for CSV format
 *
 * Handles:
 * - Null/undefined values -> "N/A"
 * - Values containing commas, quotes, or newlines -> wrapped in quotes
 * - Embedded quotes -> doubled ("")
 *
 * @param value - The value to escape
 * @returns The escaped string safe for CSV
 */
export function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const str = String(value);

  // Check if the field needs quoting
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape embedded quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate CSV content from gradebook matrix data
 *
 * Output format:
 * - Header row: Student Name, Email, <Assignment titles>, Total Points, Percentage, GPA
 * - Data rows: Student data with scores or "N/A" for missing grades
 * - UTF-8 BOM prepended for Excel compatibility
 *
 * @param matrix - The gradebook data to export
 * @returns CSV string with UTF-8 BOM
 */
export function generateGradebookCSV(matrix: CSVGradebookMatrix): string {
  const { students, assignments } = matrix;

  // Build header row
  const assignmentHeaders = assignments.map(
    (a) => escapeCSV(`${a.title} (${a.maxPoints})`)
  );

  const headerRow = [
    'Student Name',
    'Email',
    ...assignmentHeaders,
    'Total Points',
    'Percentage',
    'GPA',
  ].join(',');

  // Build data rows
  const dataRows = students.map((student) => {
    // Get scores for each assignment in order
    const assignmentScores = assignments.map((assignment) => {
      const grade = student.grades.find((g) => g.assignmentId === assignment.id);

      if (grade?.score !== null && grade?.score !== undefined) {
        return escapeCSV(grade.score);
      }

      // Return status for non-graded items
      return escapeCSV(grade?.status || null);
    });

    // Calculate total possible points
    const totalPossible = assignments.reduce((sum, a) => sum + a.maxPoints, 0);

    return [
      escapeCSV(student.name),
      escapeCSV(student.email),
      ...assignmentScores,
      escapeCSV(`${student.totalPoints}/${totalPossible}`),
      escapeCSV(`${student.percentage.toFixed(1)}%`),
      escapeCSV(student.gpa !== null ? student.gpa.toFixed(2) : null),
    ].join(',');
  });

  // Combine header and data rows with UTF-8 BOM
  const csv = [headerRow, ...dataRows].join('\n');
  return UTF8_BOM + csv;
}

/**
 * Generate CSV filename following the pattern: {CourseCode}_grades_{YYYY-MM-DD}.csv
 *
 * @param courseCode - The course code (e.g., "CS101")
 * @returns Formatted filename string
 */
export function generateCSVFilename(courseCode: string): string {
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  // Sanitize course code to be filename-safe
  const safeCode = courseCode.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${safeCode}_grades_${dateStr}.csv`;
}

/**
 * Generate a simple CSV string for small datasets (no streaming)
 * Alias for generateGradebookCSV for clarity in usage
 */
export const generateCSV = generateGradebookCSV;

/**
 * Validate that the matrix has exportable data
 *
 * @param matrix - The gradebook matrix to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateExportData(
  matrix: CSVGradebookMatrix
): { isValid: boolean; error?: string } {
  if (!matrix.students || matrix.students.length === 0) {
    return {
      isValid: false,
      error: 'No students to export. The gradebook is empty.',
    };
  }

  if (!matrix.assignments || matrix.assignments.length === 0) {
    return {
      isValid: true, // Can still export with just student info
    };
  }

  return { isValid: true };
}

/**
 * Calculate export statistics for logging
 */
export function getExportStats(matrix: CSVGradebookMatrix): {
  studentCount: number;
  assignmentCount: number;
  totalCells: number;
  estimatedSize: number;
} {
  const studentCount = matrix.students.length;
  const assignmentCount = matrix.assignments.length;
  const totalCells = studentCount * (assignmentCount + 5); // +5 for name, email, total, %, GPA
  // Rough estimate: ~20 bytes per cell average
  const estimatedSize = totalCells * 20;

  return {
    studentCount,
    assignmentCount,
    totalCells,
    estimatedSize,
  };
}
