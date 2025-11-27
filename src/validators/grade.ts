/**
 * Grade Validation Schemas
 *
 * Zod schemas for validating grading-related API requests.
 */

import { z } from 'zod'
import { cuidSchema, stringWithLength } from '@/lib/validation'
import { sanitizeHtml } from '@/lib/sanitize'

// ============================================
// Grade Schemas
// ============================================

/**
 * Schema for grading a submission
 */
export const gradeSubmissionSchema = z.object({
  submissionId: cuidSchema,
  points: z
    .number()
    .min(0, 'Points cannot be negative')
    .max(10000, 'Points cannot exceed 10000'),
  feedback: z
    .string()
    .max(5000, 'Feedback must be 5000 characters or less')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
})

/**
 * Schema for updating a grade
 */
export const updateGradeSchema = z
  .object({
    points: z
      .number()
      .min(0)
      .max(10000)
      .optional(),
    feedback: z
      .string()
      .max(5000)
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
  })
  .refine(
    (data) => data.points !== undefined || data.feedback !== undefined,
    { message: 'At least points or feedback must be provided' }
  )

/**
 * Schema for bulk grading
 */
export const bulkGradeSchema = z.object({
  grades: z.array(
    z.object({
      submissionId: cuidSchema,
      points: z.number().min(0).max(10000),
      feedback: z
        .string()
        .max(5000)
        .transform(sanitizeHtml)
        .optional()
        .nullable(),
    })
  ).min(1, 'At least one grade is required'),
})

// ============================================
// Type Exports
// ============================================

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>
export type BulkGradeInput = z.infer<typeof bulkGradeSchema>
