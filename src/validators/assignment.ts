/**
 * Assignment Validation Schemas
 *
 * Zod schemas for validating assignment-related API requests.
 */

import { z } from 'zod'
import { cuidSchema, stringWithLength, positiveIntSchema } from '@/lib/validation'
import { sanitizeHtml } from '@/lib/sanitize'

// ============================================
// Assignment Schemas
// ============================================

/**
 * Schema for creating an assignment
 */
export const createAssignmentSchema = z.object({
  title: stringWithLength(3, 200, 'Title'),
  description: z
    .string()
    .max(10000, 'Description must be 10000 characters or less')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
  dueDate: z
    .string()
    .datetime('Invalid date format (use ISO 8601)')
    .optional()
    .nullable(),
  maxPoints: z
    .number()
    .int('Points must be a whole number')
    .min(1, 'Points must be at least 1')
    .max(10000, 'Points cannot exceed 10000')
    .optional()
    .default(100),
  isPublished: z.boolean().optional().default(false),
  courseId: cuidSchema,
})

/**
 * Schema for updating an assignment
 */
export const updateAssignmentSchema = z
  .object({
    title: stringWithLength(3, 200, 'Title').optional(),
    description: z
      .string()
      .max(10000)
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
    dueDate: z
      .string()
      .datetime('Invalid date format')
      .optional()
      .nullable(),
    maxPoints: z
      .number()
      .int()
      .min(1)
      .max(10000)
      .optional(),
    isPublished: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' }
  )

// ============================================
// Submission Schemas
// ============================================

/**
 * Schema for submitting an assignment
 */
export const createSubmissionSchema = z
  .object({
    content: z
      .string()
      .max(50000, 'Content must be 50000 characters or less')
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
    fileUrl: z.string().url('Invalid file URL').optional().nullable(),
  })
  .refine(
    (data) => data.content || data.fileUrl,
    { message: 'Either content or file is required' }
  )

/**
 * Schema for updating a submission
 */
export const updateSubmissionSchema = z
  .object({
    content: z
      .string()
      .max(50000)
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
    fileUrl: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => data.content || data.fileUrl,
    { message: 'Either content or file is required' }
  )

// ============================================
// Type Exports
// ============================================

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>
