/**
 * Feedback Template Validation Schemas
 *
 * Zod schemas for validating feedback template API requests.
 */

import { z } from 'zod'
import { cuidSchema, stringWithLength } from '@/lib/validation'
import { sanitizeHtml } from '@/lib/sanitize'

// ============================================
// Constants
// ============================================

/**
 * Valid template categories
 */
export const TEMPLATE_CATEGORIES = [
  'excellent',
  'needs-improvement',
  'missing-requirements',
  'late',
] as const

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]

/**
 * Category display labels
 */
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  excellent: 'Excellent Work',
  'needs-improvement': 'Needs Improvement',
  'missing-requirements': 'Missing Requirements',
  late: 'Late Submission',
}

/**
 * Category colors for UI
 */
export const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  excellent: 'bg-green-100 text-green-800',
  'needs-improvement': 'bg-yellow-100 text-yellow-800',
  'missing-requirements': 'bg-red-100 text-red-800',
  late: 'bg-orange-100 text-orange-800',
}

// ============================================
// Template Schemas
// ============================================

/**
 * Schema for creating a feedback template
 */
export const feedbackTemplateSchema = z.object({
  name: stringWithLength(1, 100, 'Template name'),
  category: z.enum(TEMPLATE_CATEGORIES, {
    message: `Category must be one of: ${TEMPLATE_CATEGORIES.join(', ')}`,
  }),
  template: z
    .string()
    .min(10, 'Template text must be at least 10 characters')
    .max(2000, 'Template text must be 2000 characters or less')
    .transform(sanitizeHtml),
  isShared: z.boolean().optional().default(false),
})

/**
 * Schema for updating a feedback template (partial updates)
 */
export const updateFeedbackTemplateSchema = z
  .object({
    name: stringWithLength(1, 100, 'Template name').optional(),
    category: z
      .enum(TEMPLATE_CATEGORIES, {
        message: `Category must be one of: ${TEMPLATE_CATEGORIES.join(', ')}`,
      })
      .optional(),
    template: z
      .string()
      .min(10, 'Template text must be at least 10 characters')
      .max(2000, 'Template text must be 2000 characters or less')
      .transform(sanitizeHtml)
      .optional(),
    isShared: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' }
  )

/**
 * Schema for applying a template (placeholder replacement)
 */
export const applyTemplateSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  assignmentTitle: z.string().min(1, 'Assignment title is required'),
  score: z.number().min(0).max(100).optional(),
  customNote: z.string().max(500, 'Custom note must be 500 characters or less').optional(),
})

/**
 * Schema for template ID parameter
 */
export const templateIdSchema = z.object({
  id: cuidSchema,
})

/**
 * Schema for template query parameters
 */
export const templateQuerySchema = z.object({
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
  sortBy: z.enum(['name', 'usageCount', 'createdAt']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

// ============================================
// Type Exports
// ============================================

export type FeedbackTemplateInput = z.infer<typeof feedbackTemplateSchema>
export type UpdateFeedbackTemplateInput = z.infer<typeof updateFeedbackTemplateSchema>
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>
export type TemplateIdInput = z.infer<typeof templateIdSchema>
export type TemplateQueryInput = z.infer<typeof templateQuerySchema>
