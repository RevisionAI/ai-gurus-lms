/**
 * File Upload Validation Schemas
 *
 * Zod schemas for validating file upload requests.
 * Used by upload API endpoints to ensure file metadata is valid.
 */

import { z } from 'zod'
import { ALLOWED_MIME_TYPES } from '@/lib/r2'

// Extract allowed MIME types from r2.ts
const allowedMimeTypes = Object.keys(ALLOWED_MIME_TYPES) as [string, ...string[]]

/**
 * Schema for requesting a signed upload URL
 */
export const signedUrlRequestSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be 255 characters or less')
    .transform((name) => sanitizeFilename(name)),
  mimeType: z
    .string()
    .refine(
      (type) => allowedMimeTypes.includes(type),
      (type) => ({ message: `File type '${type}' is not allowed` })
    ),
  size: z
    .number()
    .positive('File size must be positive')
    .max(
      500 * 1024 * 1024, // 500MB max (video limit)
      'File size exceeds maximum allowed (500MB)'
    ),
  directory: z
    .enum(['courses', 'submissions', 'profiles', 'thumbnails'])
    .default('courses'),
})

/**
 * Schema for completing an upload (storing metadata)
 */
export const uploadCompleteSchema = z.object({
  key: z.string().min(1, 'S3 key is required'),
  filename: z.string().min(1, 'Filename is required'),
  size: z.number().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  contentId: z.string().optional(), // For course content
  assignmentId: z.string().optional(), // For submissions
  isPublic: z.boolean().default(false), // Whether to use public CDN URL
})

/**
 * Sanitize filename to prevent path traversal and special character issues
 *
 * @param filename - Original filename
 * @returns Sanitized filename safe for S3 keys
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '')

  // Remove path separators
  sanitized = sanitized.replace(/[/\\]/g, '')

  // Replace special characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '')

  // Ensure filename isn't empty after sanitization
  if (!sanitized || sanitized === '') {
    sanitized = 'unnamed_file'
  }

  // Truncate if too long (preserve extension)
  if (sanitized.length > 200) {
    const ext = sanitized.split('.').pop() || ''
    const baseName = sanitized.slice(0, 200 - ext.length - 1)
    sanitized = ext ? `${baseName}.${ext}` : baseName
  }

  return sanitized
}

/**
 * Error codes for upload failures
 */
export const UploadErrorCodes = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_TIMEOUT: 'UPLOAD_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  S3_ERROR: 'S3_ERROR',
} as const

export type UploadErrorCode = (typeof UploadErrorCodes)[keyof typeof UploadErrorCodes]

/**
 * Create a standardized error response for upload failures
 */
export function createUploadError(
  code: UploadErrorCode,
  message: string,
  details?: Record<string, unknown>
): {
  error: {
    code: UploadErrorCode
    message: string
    details?: Record<string, unknown>
  }
} {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }
}

/**
 * Get maximum file size for a given MIME type
 */
export function getMaxFileSize(mimeType: string): number {
  const typeConfig = ALLOWED_MIME_TYPES[mimeType as keyof typeof ALLOWED_MIME_TYPES]
  return typeConfig?.maxSize || 50 * 1024 * 1024 // Default 50MB
}

/**
 * Validate file size against MIME type specific limits
 */
export function validateFileSize(
  mimeType: string,
  size: number
): { valid: boolean; error?: string; maxSize?: number } {
  const maxSize = getMaxFileSize(mimeType)

  if (size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024)
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${maxSizeMB}MB for this file type)`,
      maxSize,
    }
  }

  return { valid: true, maxSize }
}

// Type exports
export type SignedUrlRequest = z.infer<typeof signedUrlRequestSchema>
export type UploadCompleteRequest = z.infer<typeof uploadCompleteSchema>
