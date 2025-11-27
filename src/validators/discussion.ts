/**
 * Discussion Validation Schemas
 *
 * Zod schemas for validating discussion-related API requests.
 */

import { z } from 'zod'
import { cuidSchema, stringWithLength } from '@/lib/validation'
import { sanitizeHtml } from '@/lib/sanitize'

// ============================================
// Discussion Schemas
// ============================================

/**
 * Schema for creating a discussion
 */
export const createDiscussionSchema = z.object({
  title: stringWithLength(3, 200, 'Title'),
  description: z
    .string()
    .max(10000, 'Description must be 10000 characters or less')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
  courseId: cuidSchema,
  isPinned: z.boolean().optional().default(false),
  isLocked: z.boolean().optional().default(false),
})

/**
 * Schema for updating a discussion
 */
export const updateDiscussionSchema = z
  .object({
    title: stringWithLength(3, 200, 'Title').optional(),
    description: z
      .string()
      .max(10000)
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
    isPinned: z.boolean().optional(),
    isLocked: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' }
  )

// ============================================
// Discussion Post Schemas
// ============================================

/**
 * Schema for creating a discussion post
 */
export const createDiscussionPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be 10000 characters or less')
    .transform(sanitizeHtml),
  discussionId: cuidSchema,
  parentId: cuidSchema.optional().nullable(), // For replies
})

/**
 * Schema for updating a discussion post
 */
export const updateDiscussionPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be 10000 characters or less')
    .transform(sanitizeHtml),
})

// ============================================
// Type Exports
// ============================================

export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>
export type UpdateDiscussionInput = z.infer<typeof updateDiscussionSchema>
export type CreateDiscussionPostInput = z.infer<typeof createDiscussionPostSchema>
export type UpdateDiscussionPostInput = z.infer<typeof updateDiscussionPostSchema>
