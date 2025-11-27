/**
 * Validation Utilities
 *
 * Helper functions for validating API request bodies using Zod schemas.
 * Provides consistent error handling and response formatting.
 */

import { z, ZodSchema, ZodError } from 'zod'
import { NextResponse } from 'next/server'

// ============================================
// Types
// ============================================

export interface ValidationSuccess<T> {
  success: true
  data: T
}

export interface ValidationFailure {
  success: false
  response: NextResponse
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

export interface ValidationErrorDetail {
  path: string
  message: string
}

export interface ValidationErrorResponse {
  error: {
    code: 'INVALID_INPUT' | 'BAD_REQUEST'
    message: string
    details?: ValidationErrorDetail[]
  }
}

// ============================================
// Error Codes
// ============================================

export const ValidationErrorCodes = {
  INVALID_INPUT: 'INVALID_INPUT',
  BAD_REQUEST: 'BAD_REQUEST',
} as const

// ============================================
// Validation Helper
// ============================================

/**
 * Validate a request body against a Zod schema
 *
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns ValidationResult with either validated data or error response
 *
 * @example
 * ```typescript
 * const validation = await validateRequest(request, createUserSchema)
 * if (!validation.success) {
 *   return validation.response
 * }
 * const { email, name, password } = validation.data
 * ```
 */
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: createValidationErrorResponse(error),
      }
    }

    // Malformed JSON or other parsing error
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: {
              code: ValidationErrorCodes.BAD_REQUEST,
              message: 'Invalid JSON in request body',
            },
          },
          { status: 400 }
        ),
      }
    }

    // Unexpected error - return generic bad request
    return {
      success: false,
      response: NextResponse.json(
        {
          error: {
            code: ValidationErrorCodes.BAD_REQUEST,
            message: 'Invalid request format',
          },
        },
        { status: 400 }
      ),
    }
  }
}

/**
 * Validate data directly (not from request)
 *
 * @param data - Data to validate
 * @param schema - Zod schema to validate against
 * @returns ValidationResult with either validated data or error response
 */
export function validateData<T>(
  data: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: createValidationErrorResponse(error),
      }
    }

    return {
      success: false,
      response: NextResponse.json(
        {
          error: {
            code: ValidationErrorCodes.BAD_REQUEST,
            message: 'Invalid data format',
          },
        },
        { status: 400 }
      ),
    }
  }
}

// ============================================
// Error Response Helpers
// ============================================

/**
 * Create a validation error response from a ZodError
 */
export function createValidationErrorResponse(error: ZodError): NextResponse {
  const details = formatZodErrors(error)

  return NextResponse.json(
    {
      error: {
        code: ValidationErrorCodes.INVALID_INPUT,
        message: 'Validation failed',
        details,
      },
    },
    { status: 400 }
  )
}

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodErrors(error: ZodError): ValidationErrorDetail[] {
  // Defensive check for edge cases where issues might be undefined
  if (!error.issues || !Array.isArray(error.issues)) {
    return [{ path: 'root', message: 'Validation failed' }]
  }
  return error.issues.map((e) => ({
    path: e.path.join('.') || 'root',
    message: e.message,
  }))
}

/**
 * Create a custom validation error response
 */
export function createCustomValidationError(
  message: string,
  details?: ValidationErrorDetail[]
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: ValidationErrorCodes.INVALID_INPUT,
        message,
        ...(details && { details }),
      },
    },
    { status: 400 }
  )
}

// ============================================
// Common Validation Helpers
// ============================================

/**
 * CUID validation regex pattern
 */
export const CUID_REGEX = /^c[a-z0-9]{24}$/

/**
 * Zod schema for CUID strings
 */
export const cuidSchema = z.string().regex(CUID_REGEX, 'Invalid ID format')

/**
 * Zod schema for optional CUID strings
 */
export const optionalCuidSchema = cuidSchema.optional()

/**
 * Zod schema for non-empty trimmed strings
 */
export const nonEmptyString = z.string().trim().min(1, 'This field is required')

/**
 * Create a string schema with min/max length
 */
export function stringWithLength(min: number, max: number, fieldName = 'Field') {
  return z
    .string()
    .trim()
    .min(min, `${fieldName} must be at least ${min} characters`)
    .max(max, `${fieldName} must be ${max} characters or less`)
}

/**
 * Email validation schema with normalization
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim()

/**
 * URL validation schema
 */
export const urlSchema = z.string().url('Invalid URL format')

/**
 * Optional URL that can be null
 */
export const optionalUrlSchema = z.string().url().nullable().optional()

/**
 * Positive integer validation
 */
export const positiveIntSchema = z.number().int().positive('Must be a positive number')

/**
 * Non-negative integer validation
 */
export const nonNegativeIntSchema = z.number().int().min(0, 'Cannot be negative')

/**
 * Future date validation
 */
export const futureDateSchema = z
  .string()
  .datetime('Invalid date format')
  .refine(
    (date) => new Date(date) > new Date(),
    'Date must be in the future'
  )

/**
 * Optional future date validation
 */
export const optionalFutureDateSchema = z
  .string()
  .datetime('Invalid date format')
  .refine(
    (date) => new Date(date) > new Date(),
    'Date must be in the future'
  )
  .optional()
  .nullable()
