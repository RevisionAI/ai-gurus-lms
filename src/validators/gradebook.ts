/**
 * Gradebook Validation Schemas
 *
 * Zod schemas for validating gradebook-related API requests.
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * Story: 2.3 - Gradebook Filtering & CSV Export
 */

import { z } from 'zod';
import { cuidSchema } from '@/lib/validation';
import { sanitizeHtml } from '@/lib/sanitize';

// ============================================
// Grade Status Values
// ============================================

/**
 * Grade status enum values for filtering
 */
export const gradeStatusValues = ['all', 'graded', 'pending', 'late', 'missing'] as const;

/**
 * Grade status enum type
 */
export type GradeStatusFilter = (typeof gradeStatusValues)[number];

// ============================================
// Grade Update Schemas (Story 2.2)
// ============================================

/**
 * Schema for grade update requests (inline editing)
 *
 * Validates:
 * - submissionId: valid CUID format
 * - grade: numeric value >= 0
 * - feedback: optional string (max 5000 chars), sanitized
 *
 * Note: maxPoints validation is performed in the API route after
 * fetching the assignment to get the actual maxPoints value.
 *
 * Story: 2.7 - Feedback Templates for Instructors - Added feedback field
 */
export const gradeUpdateSchema = z.object({
  submissionId: cuidSchema,
  grade: z.number().min(0, 'Grade cannot be negative'),
  feedback: z
    .string()
    .max(5000, 'Feedback must be 5000 characters or less')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
});

/**
 * TypeScript type inferred from gradeUpdateSchema
 */
export type GradeUpdateInput = z.infer<typeof gradeUpdateSchema>;

/**
 * Schema for bulk grade updates (future use)
 */
export const bulkGradeUpdateSchema = z.object({
  grades: z.array(gradeUpdateSchema).min(1, 'At least one grade is required'),
});

export type BulkGradeUpdateInput = z.infer<typeof bulkGradeUpdateSchema>;

// ============================================
// Gradebook Filter Schemas (Story 2.3)
// ============================================

/**
 * Schema for validating date strings (ISO format or YYYY-MM-DD)
 */
const dateStringSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Allow empty strings
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format' }
  );

/**
 * Gradebook filters validation schema
 *
 * Validates query parameters for gradebook GET and export endpoints:
 * - studentFilter: Optional string for student name search (max 200 chars)
 * - assignmentId: Optional CUID for filtering to a single assignment
 * - dateFrom: Optional ISO date string for filtering by assignment due date
 * - dateTo: Optional ISO date string for filtering by assignment due date
 * - status: Optional enum for filtering by grade status
 *
 * Includes cross-field validation to ensure dateFrom <= dateTo when both provided.
 */
export const gradebookFiltersSchema = z
  .object({
    studentFilter: z
      .string()
      .max(200, 'Student filter must be 200 characters or less')
      .optional()
      .transform((val) => val || undefined),
    assignmentId: cuidSchema
      .optional()
      .or(z.literal(''))
      .transform((val) => val || undefined),
    dateFrom: dateStringSchema
      .optional()
      .or(z.literal(''))
      .transform((val) => val || undefined),
    dateTo: dateStringSchema
      .optional()
      .or(z.literal(''))
      .transform((val) => val || undefined),
    status: z
      .enum(gradeStatusValues)
      .optional()
      .default('all'),
  })
  .refine(
    (data) => {
      // Validate date range: From <= To
      if (data.dateFrom && data.dateTo) {
        const fromDate = new Date(data.dateFrom);
        const toDate = new Date(data.dateTo);
        return fromDate <= toDate;
      }
      return true;
    },
    {
      message: 'From date must be before or equal to To date',
      path: ['dateFrom'],
    }
  );

/**
 * Inferred types from the gradebook filters schema
 */
export type GradebookFiltersInput = z.input<typeof gradebookFiltersSchema>;
export type GradebookFilters = z.output<typeof gradebookFiltersSchema>;

/**
 * Schema for validating course ID parameter
 */
export const courseIdSchema = z.object({
  courseId: cuidSchema,
});

/**
 * Parse and validate gradebook filter query parameters from URL
 *
 * @param searchParams - URLSearchParams from request
 * @returns Parsed and validated filter object
 */
export function parseGradebookFilters(
  searchParams: URLSearchParams
): { success: true; data: GradebookFilters } | { success: false; error: z.ZodError } {
  const rawFilters = {
    studentFilter: searchParams.get('studentFilter') || undefined,
    assignmentId: searchParams.get('assignmentId') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    status: searchParams.get('status') || undefined,
  };

  const result = gradebookFiltersSchema.safeParse(rawFilters);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Check if any filters are active (not default)
 */
export function hasActiveFilters(filters: Partial<GradebookFilters>): boolean {
  return (
    filters.studentFilter !== undefined ||
    filters.assignmentId !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    (filters.status !== undefined && filters.status !== 'all')
  );
}
