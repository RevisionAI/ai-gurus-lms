/**
 * Course Validation Schemas
 *
 * Zod schemas for validating course-related API requests.
 */

import { z } from 'zod'
import { cuidSchema, stringWithLength, optionalUrlSchema, positiveIntSchema } from '@/lib/validation'
import { sanitizeHtml } from '@/lib/sanitize'

// ============================================
// Course Schemas
// ============================================

/**
 * Schema for course prerequisites fields (used in both create and update)
 */
export const coursePrerequisitesSchema = z.object({
  prerequisites: z
    .string()
    .max(2000, 'Prerequisites must be 2000 characters or less')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
  learningObjectives: z
    .array(
      z.string().max(500, 'Each learning objective must be 500 characters or less')
    )
    .max(20, 'Maximum 20 learning objectives allowed')
    .default([]),
  targetAudience: z
    .string()
    .max(1000, 'Target audience must be 1000 characters or less')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
})

/**
 * Schema for creating a course
 */
export const createCourseSchema = z.object({
  title: stringWithLength(3, 200, 'Title'),
  code: z
    .string()
    .trim()
    .min(1, 'Course code is required')
    .max(20, 'Course code must be 20 characters or less')
    .regex(
      /^[A-Z]{2,6}-?\d{2,4}$/,
      'Course code must be format "XX-123" or "XXXX1234" (e.g., "CS-101", "MGMT2001")'
    )
    .toUpperCase(),
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
  semester: z
    .string()
    .trim()
    .regex(
      /^(Spring|Summer|Fall|Winter)$/,
      'Semester must be Spring, Summer, Fall, or Winter'
    ),
  year: positiveIntSchema,
  isActive: z.boolean().optional().default(true),
  // Course prerequisites fields
  prerequisites: coursePrerequisitesSchema.shape.prerequisites,
  learningObjectives: coursePrerequisitesSchema.shape.learningObjectives,
  targetAudience: coursePrerequisitesSchema.shape.targetAudience,
})

/**
 * Schema for updating a course
 */
export const updateCourseSchema = z
  .object({
    title: stringWithLength(3, 200, 'Title').optional(),
    code: z
      .string()
      .trim()
      .max(20)
      .regex(/^[A-Z]{2,6}-?\d{2,4}$/)
      .toUpperCase()
      .optional(),
    description: z
      .string()
      .max(5000)
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
    semester: z
      .string()
      .trim()
      .regex(/^(Spring|Summer|Fall|Winter)$/)
      .optional(),
    year: positiveIntSchema.optional(),
    isActive: z.boolean().optional(),
    // Course prerequisites fields (all optional for partial updates)
    prerequisites: z
      .string()
      .max(2000, 'Prerequisites must be 2000 characters or less')
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
    learningObjectives: z
      .array(
        z.string().max(500, 'Each learning objective must be 500 characters or less')
      )
      .max(20, 'Maximum 20 learning objectives allowed')
      .optional(),
    targetAudience: z
      .string()
      .max(1000, 'Target audience must be 1000 characters or less')
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' }
  )

/**
 * Schema for enrolling a user in a course
 */
export const enrollmentSchema = z.object({
  courseId: cuidSchema,
  userId: cuidSchema.optional(), // Optional - defaults to current user for self-enrollment
})

/**
 * Schema for bulk enrollment
 */
export const bulkEnrollmentSchema = z.object({
  courseId: cuidSchema,
  userIds: z.array(cuidSchema).min(1, 'At least one user ID is required'),
})

/**
 * Schema for unenrollment
 */
export const unenrollmentSchema = z.object({
  courseId: cuidSchema,
  userId: cuidSchema.optional(), // Optional - defaults to current user
})

// ============================================
// Course Content Schemas
// ============================================

/**
 * Content types supported by the LMS
 */
const contentTypeEnum = z.enum(['TEXT', 'VIDEO', 'DOCUMENT', 'LINK', 'SCORM', 'YOUTUBE'])

/**
 * Schema for creating course content
 */
export const createContentSchema = z.object({
  title: stringWithLength(1, 200, 'Title'),
  type: contentTypeEnum,
  content: z
    .string()
    .max(50000, 'Content must be 50000 characters or less')
    .transform(sanitizeHtml)
    .optional()
    .nullable(),
  fileUrl: optionalUrlSchema,
  thumbnailUrl: optionalUrlSchema,
  orderIndex: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional().default(false),
})

/**
 * Schema for updating course content
 */
export const updateContentSchema = z
  .object({
    title: stringWithLength(1, 200, 'Title').optional(),
    type: contentTypeEnum.optional(),
    content: z
      .string()
      .max(50000)
      .transform(sanitizeHtml)
      .optional()
      .nullable(),
    fileUrl: optionalUrlSchema,
    thumbnailUrl: optionalUrlSchema,
    orderIndex: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' }
  )

/**
 * Schema for reordering content
 */
export const reorderContentSchema = z.object({
  items: z.array(
    z.object({
      id: cuidSchema,
      orderIndex: z.number().int().min(0),
    })
  ),
})

// ============================================
// Type Exports
// ============================================

export type CoursePrerequisitesInput = z.infer<typeof coursePrerequisitesSchema>
export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>
export type EnrollmentInput = z.infer<typeof enrollmentSchema>
export type BulkEnrollmentInput = z.infer<typeof bulkEnrollmentSchema>
export type UnenrollmentInput = z.infer<typeof unenrollmentSchema>
export type CreateContentInput = z.infer<typeof createContentSchema>
export type UpdateContentInput = z.infer<typeof updateContentSchema>
export type ReorderContentInput = z.infer<typeof reorderContentSchema>
