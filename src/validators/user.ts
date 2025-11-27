/**
 * User Validation Schemas
 *
 * Zod schemas for validating user-related API requests.
 */

import { z } from 'zod'
import { emailSchema, stringWithLength } from '@/lib/validation'

// ============================================
// Password Validation
// ============================================

/**
 * Password requirements:
 * - Minimum 8 characters
 * - Maximum 100 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be 100 characters or less')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// ============================================
// User Schemas
// ============================================

/**
 * Schema for user registration
 */
export const registerUserSchema = z.object({
  email: emailSchema,
  name: stringWithLength(1, 100, 'Name'),
  surname: stringWithLength(1, 100, 'Surname'),
  password: passwordSchema,
  cellNumber: z
    .string()
    .trim()
    .min(1, 'Cell number is required')
    .max(20, 'Cell number must be 20 characters or less'),
  company: stringWithLength(1, 200, 'Company'),
  position: stringWithLength(1, 100, 'Position'),
  workAddress: stringWithLength(1, 500, 'Work address'),
})

/**
 * Schema for creating a user (admin endpoint)
 * Includes role selection
 */
export const createUserSchema = registerUserSchema.extend({
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional().default('STUDENT'),
})

/**
 * Schema for updating a user
 * All fields optional, but at least one must be provided
 */
export const updateUserSchema = z
  .object({
    email: emailSchema.optional(),
    name: stringWithLength(1, 100, 'Name').optional(),
    surname: stringWithLength(1, 100, 'Surname').optional(),
    cellNumber: z.string().trim().max(20).optional(),
    company: stringWithLength(1, 200, 'Company').optional(),
    position: stringWithLength(1, 100, 'Position').optional(),
    workAddress: stringWithLength(1, 500, 'Work address').optional(),
    role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided for update' }
  )

/**
 * Schema for changing password
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  )

/**
 * Schema for login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// ============================================
// Admin User Management Schemas (Story 2.5)
// ============================================

/**
 * Schema for admin creating a user
 * Password is optional - if not provided, a secure random password will be generated
 */
export const adminCreateUserSchema = z.object({
  name: stringWithLength(1, 100, 'Name'),
  email: emailSchema,
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be 100 characters or less')
    .optional(),
})

/**
 * Schema for admin updating a user
 * All fields optional for partial updates
 */
export const adminUpdateUserSchema = z.object({
  name: stringWithLength(1, 100, 'Name').optional(),
  email: emailSchema.optional(),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
})

/**
 * Schema for user search/filter query parameters
 */
export const userSearchSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// ============================================
// Type Exports
// ============================================

export type RegisterUserInput = z.infer<typeof registerUserSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>
export type UserSearchInput = z.infer<typeof userSearchSchema>
