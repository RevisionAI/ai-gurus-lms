/**
 * Announcement Validation Schemas
 *
 * Zod schemas for validating announcement-related API requests.
 */

import { z } from 'zod'
import { cuidSchema, stringWithLength } from '@/lib/validation'
import { sanitizeHtml } from '@/lib/sanitize'

// ============================================
// Announcement Schemas
// ============================================

/**
 * Schema for creating an announcement
 */
export const createAnnouncementSchema = z.object({
  title: stringWithLength(3, 200, 'Title'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be 10000 characters or less')
    .transform(sanitizeHtml),
  courseId: cuidSchema,
})

/**
 * Schema for updating an announcement
 */
export const updateAnnouncementSchema = z
  .object({
    title: stringWithLength(3, 200, 'Title').optional(),
    content: z
      .string()
      .min(1)
      .max(10000)
      .transform(sanitizeHtml)
      .optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.content !== undefined,
    { message: 'At least title or content must be provided' }
  )

// ============================================
// Type Exports
// ============================================

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>
